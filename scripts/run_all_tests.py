import os
import subprocess
import sys
import json

def run_tests():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    web_test_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "test"))
    test_files = [
        'test_complete_system.py',
        'test_persistence.py',
        'test_import_options_modal.py',
        'test_import_dictionary.py',
        'test_delete_word.py',
        'test_audio_player.py',
        'test_audio_casing_rules.py'
    ]

    results = []
    all_passed = True

    for test_file in test_files:
        path = os.path.join(web_test_dir, test_file)
        cmd = [sys.executable, path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            results.append({"test": test_file, "status": "PASS"})
        else:
            all_passed = False
            results.append({"test": test_file, "status": "FAIL", "error": res.stderr.strip() or res.stdout.strip()})

    summary = {
        "status": "PASS" if all_passed else "FAIL",
        "total": len(test_files),
        "passed": sum(1 for r in results if r["status"] == "PASS"),
        "failed": sum(1 for r in results if r["status"] == "FAIL"),
        "details": results
    }

    print(json.dumps(summary, ensure_ascii=False, indent=None))

if __name__ == '__main__':
    run_tests()
