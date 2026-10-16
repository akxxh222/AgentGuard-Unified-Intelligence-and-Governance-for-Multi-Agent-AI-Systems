from __future__ import annotations

import os
import subprocess
import sys
import unittest
from unittest.mock import patch

from anomaly.detectors.loop_detector import LoopDetector
from demo.run import main, parse_args
from demo.scenario import build_events, validate_event


class DemoScenarioTests(unittest.TestCase):
    def test_normal_events_are_valid_and_cover_frameworks(self):
        events = build_events(run_id="test-normal")
        for event in events:
            validate_event(event)
        self.assertEqual({e["framework"] for e in events}, {"langchain", "autogen", "crewai"})
        self.assertTrue(any(e["parent_agent_id"] for e in events))
        self.assertEqual(len({e["trace_id"] for e in events}), 1)
        self.assertTrue(all(e["task_id"] and e["team_id"] for e in events))

    def test_loop_is_exactly_five_consecutive_identical_calls(self):
        events = build_events(inject_loop=True, run_id="test-loop")
        matches = [i for i, e in enumerate(events) if e["event_type"] == "tool_call" and e["payload"].get("tool") == "retry_compile"]
        self.assertEqual(matches, list(range(matches[0], matches[0] + 5)))
        calls = [events[i] for i in matches]
        self.assertEqual(len(calls), 5)
        self.assertEqual(len({(e["agent_id"], e["trace_id"], str(e["payload"])) for e in calls}), 1)

    def test_loop_scenario_produces_one_real_detector_alert_at_threshold_five(self):
        detector = LoopDetector(max_iterations=5)
        alerts = [alert for event in build_events(inject_loop=True, run_id="detector") if (alert := detector.check(event))]
        loop_alerts = [alert for alert in alerts if alert["detector"] == "loop_detector" and alert["details"]["tool"] == "retry_compile"]
        self.assertEqual(len(loop_alerts), 1)

    def test_no_ai_credentials_are_needed(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertGreater(len(build_events(run_id="no-credentials")), 0)

    def test_cli_arguments(self):
        args = parse_args(["--inject-loop", "--dry-run", "--delay", "0.01"])
        self.assertTrue(args.inject_loop)
        self.assertTrue(args.dry_run)
        self.assertEqual(args.delay, 0.01)

    def test_failed_collector_is_reported_as_failure(self):
        with patch("demo.run._json_request", side_effect=RuntimeError("collector unavailable")):
            self.assertEqual(main(["--collector-url", "http://localhost:1", "--timeout", "0.01"]), 1)

    def test_help_command(self):
        result = subprocess.run([sys.executable, "-m", "demo.run", "--help"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertIn("--inject-loop", result.stdout)


if __name__ == "__main__":
    unittest.main()
