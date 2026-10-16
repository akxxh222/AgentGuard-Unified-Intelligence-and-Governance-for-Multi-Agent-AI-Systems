"""CLI for the deterministic AgentGuard demo."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from demo.scenario import build_events


def _json_request(url: str, timeout: float, data: dict[str, Any] | None = None) -> Any:
    body = json.dumps(data).encode() if data is not None else None
    request = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST" if body else "GET")
    try:
        with urlopen(request, timeout=timeout) as response:
            content = response.read()
            return json.loads(content) if content else None
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"collector request failed for {url}: {exc}") from exc


def _alerts(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return value
    if isinstance(value, dict) and isinstance(value.get("alerts"), list):
        return value["alerts"]
    return []


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Emit deterministic synthetic AgentGuard events.")
    parser.add_argument("--inject-loop", action="store_true", help="emit five consecutive identical tool calls")
    parser.add_argument("--collector-url", default=os.getenv("AGENTGUARD_COLLECTOR_URL", "http://localhost:8000"), help="collector base URL (default: %(default)s)")
    parser.add_argument("--delay", type=float, default=0.0, help="seconds to wait between events")
    parser.add_argument("--timeout", type=float, default=2.0, help="HTTP timeout in seconds")
    parser.add_argument("--dry-run", action="store_true", help="generate and validate events without HTTP submission")
    args = parser.parse_args(argv)
    if args.delay < 0 or args.timeout <= 0:
        parser.error("--delay must be non-negative and --timeout must be positive")
    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    events = build_events(args.inject_loop)
    submitted = 0
    confirmed = False
    error = None
    before: list[dict[str, Any]] = []
    base = args.collector_url.rstrip("/")
    if not args.dry_run:
        try:
            if args.inject_loop:
                before = _alerts(_json_request(f"{base}/alerts", args.timeout))
            for event in events:
                _json_request(f"{base}/events", args.timeout, event)
                submitted += 1
                if args.delay:
                    time.sleep(args.delay)
            if args.inject_loop:
                after = _alerts(_json_request(f"{base}/alerts", args.timeout))
                new_alerts = after[len(before):] if len(after) >= len(before) else after
                matches = [a for a in new_alerts if a.get("agent_id") == "coder-01" and "loop" in str(a.get("detector", a.get("type", ""))).lower()]
                confirmed = len(matches) == 1
        except RuntimeError as exc:
            error = str(exc)
    identities = ", ".join(f"{e['agent_name']} ({e['framework']})" for e in events if e["event_type"] == "start")
    print(f"Events: generated={len(events)} submitted={submitted}")
    print(f"Agents: {identities}")
    print(f"Loop injected: {'yes' if args.inject_loop else 'no'}")
    print(f"Loop alert confirmed: {'yes' if confirmed else 'no'}")
    if args.dry_run:
        print("Mode: dry-run (no collector requests)")
        return 0
    if error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    if args.inject_loop and not confirmed:
        print("ERROR: collector accepted events but exactly one loop alert was not confirmed", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

