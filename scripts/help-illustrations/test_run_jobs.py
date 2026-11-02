"""Tests for run_jobs.py. Run: python -I scripts/help-illustrations/test_run_jobs.py"""
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import textwrap
import unittest

HERE = pathlib.Path(__file__).resolve().parent
RUN_JOBS = HERE / "run_jobs.py"


class RunJobsTest(unittest.TestCase):
    def run_with_fake_generator(self, generator_body: str, stale_output: bool) -> subprocess.CompletedProcess:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = pathlib.Path(tmp)
            gen = tmp_path / "fake_generate.py"
            gen.write_text(textwrap.dedent(generator_body), encoding="utf-8")
            out = tmp_path / "out"
            out.mkdir()
            if stale_output:
                (out / "frame.png").write_bytes(b"stale")
            jobs = tmp_path / "jobs.json"
            jobs.write_text(json.dumps([{"name": "frame.png", "prompt": "x"}]), encoding="utf-8")
            env = dict(os.environ, NANOBANANA_GENERATE=str(gen), GEMINI_API_KEY="test-key")
            return subprocess.run(
                [sys.executable, "-I", str(RUN_JOBS), str(jobs), str(out)],
                env=env, capture_output=True, text=True,
            )

    def test_failed_generation_is_reported_as_fail_even_when_a_stale_file_exists(self):
        r = self.run_with_fake_generator("import sys; print('boom'); sys.exit(1)", stale_output=True)
        self.assertIn("FAIL frame.png", r.stdout)
        self.assertNotEqual(r.returncode, 0)

    def test_successful_generation_is_reported_as_ok(self):
        body = """
            import sys
            out = sys.argv[sys.argv.index('-o') + 1]
            open(out, 'wb').write(b'fresh')
        """
        r = self.run_with_fake_generator(body, stale_output=True)
        self.assertIn("OK   frame.png", r.stdout)
        self.assertEqual(r.returncode, 0)


if __name__ == "__main__":
    unittest.main()
