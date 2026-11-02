"""Run Nano Banana image-generation jobs in parallel.

usage: python run_jobs.py JOBS.json OUT_DIR [--concurrency 6] [--inputs DIR]

A job is {"name": "file.png", "prompt": "...", "ratio": "3:2", "size": "2K",
"input": "reference.png", "kept": true, "note": "..."}; ratio, size, input,
kept and note are optional. A relative "input" is resolved against --inputs.
The generate script comes from the env var NANOBANANA_GENERATE (default: the
installed nanobanana skill). GEMINI_API_KEY is read from the repo's .env.local
and never printed.
"""
import argparse
import concurrent.futures as cf
import json
import os
import pathlib
import subprocess
import sys

DEFAULT_GENERATE = (
    pathlib.Path.home()
    / ".claude/skills/synced/7c581858-5e74-4335-adfd-74d02b97e266_d2094c1b-25ea-45f4-87b8-c4ce2c4a5c1c/nanobanana/scripts/generate.py"
)
ENV_FILE = pathlib.Path(__file__).resolve().parents[2] / ".env.local"


def load_env() -> dict:
    env = dict(os.environ)
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            if line.startswith("GEMINI_API_KEY="):
                env["GEMINI_API_KEY"] = line.split("=", 1)[1].strip().strip('"')
    if "GEMINI_API_KEY" not in env:
        sys.exit("GEMINI_API_KEY is missing: put it in .env.local at the repo root")
    return env


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("jobs")
    ap.add_argument("outdir")
    ap.add_argument("--concurrency", type=int, default=6)
    ap.add_argument("--inputs", default=".", help="directory that relative job inputs are resolved against")
    a = ap.parse_args()

    generate = pathlib.Path(os.environ.get("NANOBANANA_GENERATE", DEFAULT_GENERATE))
    if not generate.exists():
        sys.exit(f"generate.py not found at {generate}; set NANOBANANA_GENERATE")
    jobs = json.loads(pathlib.Path(a.jobs).read_text(encoding="utf-8"))
    out = pathlib.Path(a.outdir)
    out.mkdir(parents=True, exist_ok=True)
    env = load_env()

    def run(job: dict) -> tuple[str, bool, str]:
        target = out / job["name"]
        target.unlink(missing_ok=True)  # a stale output must never pass as a fresh one
        cmd = [sys.executable, "-I", str(generate), job["prompt"], "--ratio", job.get("ratio", "3:2"), "-o", str(target)]
        if job.get("size"):
            cmd += ["--size", job["size"]]
        if job.get("input"):
            cmd += ["-i", str(pathlib.Path(a.inputs) / job["input"])]
        r = subprocess.run(cmd, env=env, capture_output=True, text=True)
        ok = r.returncode == 0 and target.exists()
        tail = "" if ok else " | ".join((r.stdout + r.stderr).strip().splitlines()[-1:])
        return job["name"], ok, tail

    failed = 0
    with cf.ThreadPoolExecutor(a.concurrency) as ex:
        for name, ok, tail in ex.map(run, jobs):
            failed += 0 if ok else 1
            print(("OK   " if ok else "FAIL ") + name + ("" if ok else "  " + tail))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
