#!/usr/bin/env -S python3 -c 'import os; os.chdir(".."); from scripts import run_tests' #
# To run this testing script, cd into the `scripts` folder containing it 
#   and then run it directly as `./run_tests.py` (making use of the shebang above)
# It is mainly used for testing that changes to verifer.py have the desired outcome and 
#   do not break any functionality.
# In the case of a long error message, you may need to pipe std_err to a program such as less 
#   in order to see the top of the error trace:
#       ./run_tests.py 2>&1 | less
# Most likely, the error comes from a yaml requirements file not conforming to the schema
#   (ei. it may be missing some required fileds or has extra fields which are not allowed).
#   The top of the error message will usually explain what is missing / wrong.
# Failures usually come from updating a yaml requirements file without updating the
#   corresponding *.expected file in the verifier_tests folder. This is nothing to be
#   alarmed about. If the change is intended, feel free to copy into it the contents of the
#   corresponding *.out file. Then the test should pass.
import json
import yaml
import jsonschema # must be installed via pip
import os
import filecmp
import shutil
from datetime import datetime

from . import verifier
from .university_info import AB_CONCENTRATIONS, BSE_CONCENTRATIONS, CERTIFICATES

DIR_PATH = os.path.dirname(os.path.realpath(__file__)) # the directory containing this file
SCHEMA_LOCATION = os.path.join(DIR_PATH, "schema.json") # path to the requirements JSON schema
TESTS_LOCATION = os.path.join(DIR_PATH, "tests") # folder where the test files are stored


def _json_format(obj):
   return json.dumps(obj, sort_keys=False, indent=2, separators=(',', ': ')) + "\n"

def main():
    with open(SCHEMA_LOCATION, 'r', encoding="utf8") as s:
        schema = yaml.safe_load(s)
    test_failed = None
    all_requirements = (["AB", "BSE"] + list(AB_CONCENTRATIONS.keys()) + list(BSE_CONCENTRATIONS.keys())
        + ["Certificate: " + cer for cer in CERTIFICATES.keys()])
    for req_name in all_requirements:
        if req_name == "Certificate: ":  # skip empty certificates
            continue
        year = datetime.now().year + 1  # class year of juniors/seniors depending on sping/fall
        courses = student_schedule
        print("Testing: " + req_name, flush=True)
        if req_name in ["AB", "BSE"]: # checking degree. No validation for degree jsons
            satisfied, courses, req_tree = verifier.check_degree(req_name, courses, year)
        elif "Certificate: " in req_name:
            req_name = req_name.split('Certificate: ')[1]
            major_filepath = os.path.join(DIR_PATH, verifier.CERTIFICATES_LOCATION, req_name + ".yaml")
            with open(major_filepath, 'r', encoding="utf8") as f:
                requirements = yaml.safe_load(f)
            jsonschema.validate(requirements, schema)
            satisfied, courses, req_tree = verifier.check_certificate(req_name, courses, year)
            req_name = "_cert_" + req_name
        else: # checking major
            major_filepath = os.path.join(DIR_PATH, verifier.MAJORS_LOCATION, req_name + ".yaml")
            with open(major_filepath, 'r', encoding="utf8") as f:
                requirements = yaml.safe_load(f)
            jsonschema.validate(requirements, schema)
            satisfied, courses, req_tree = verifier.check_major(req_name, courses, year)
        out_path = os.path.join(TESTS_LOCATION, req_name)
        with open (out_path + ".out", "w", encoding="utf8") as f:
            f.write(_json_format(courses))
            f.write("\n")
            f.write(_json_format(req_tree))
        # use the most informative diff output
        if shutil.which("colordiff"):
            diff = "colordiff"
        elif shutil.which("diff"):
            diff = "diff"
        else:
            diff = "cmp"
        # if the expected file doesn't exist, create it
        if not os.path.exists(out_path + ".expected"):
            shutil.copyfile(out_path + ".out", out_path + ".expected")
        # check if output is correct
        if not filecmp.cmp(out_path + ".expected", out_path + ".out"):
            print("\033[91m\033[1m*** Failed ***\033[0m")
            if test_failed == None:
                test_failed = "echo 'Failed test:' %s; %s %s %s | head -10" % (req_name, diff, out_path+".expected", out_path+".out")
        else:
            print("\033[92m    Success    \033[0m")
    if test_failed:
        os.system(test_failed)

# Student schedule to test against
# Note that changing this schedule requires updating the tests/*.expected files. 
# Changing this without updating those files will cause all the tests to fail.
# Update them by deleting all the files in tests/ files and then rerunning this script
#   to regenerate them.
student_schedule = \
[
  [
    {
      "name": "COS 126",
      "title": "Computer Science: An Interdisciplinary Approach",
      "id": "1184002051",
      "dist_area": "QR"
    },
    {
      "name": "AP Calculus BC",
      "title": None,
      "id": None,
      "dist_area": None,
      "external": True,
      "settled": [
        "Major//2018//COS-AB//Prerequisites//Calculus"
      ]
    },
    {
      "name": "MSE301",
      "title": "Materials Science and Engineering",
      "id": "1184042768",
      "dist_area": "STN"
    },
    {
      "name": "CEE312",
      "title": "Statics of Structures",
      "id": "1184022796",
      "dist_area": "STN"
    },
    {
      "name": "MAE206",
      "title": "Introduction to Engineering Dynamics",
      "id": "1184022790",
      "dist_area": "STN"
    }
  ],
  [
    {
      "name": "COS340",
      "title": "Reasoning about Computation",
      "id": "1184010455",
      "dist_area": "QR",
      "settled": [
        "Major//2018//ECE//Mathematics"
      ]
    },
    {
      "name": "COS 333",
      "title": "Advanced Programming Techniques",
      "id": "1184002065",
      "dist_area": None,
      "settled": [
        "Major//2018//ECE//Breadth"
      ]
    },
    {
      "name": "COS340",
      "title": "Reasoning about Computation",
      "id": "1184010455",
      "dist_area": "QR",
      "settled": [
        "Major//2018//COS-AB//Core Courses//Theory"
      ]
    },
    {
      "name": "COS 333",
      "title": "Advanced Programming Techniques",
      "id": "1184002065",
      "dist_area": None,
      "settled": [
        "Major//2018//COS-AB//Core Courses//Systems"
      ]
    }
  ],
  [
    {
      "name": "ECE 497",
      "title": "Senior Thesis",
      "id": "1184001234",
      "dist_area": None
    },
    {
      "name": "ECE 206/COS 306",
      "title": "Contemporary Logic Design",
      "id": "1184022331",
      "dist_area": "STL",
      "settled": [
        "Major//2018//ECE//Foundation"
      ]
    },
    {
      "name": "COS 423",
      "title": "Theory of Algorithms",
      "id": "1184002071",
      "dist_area": None,
      "settled": [
        "Major//2018//ECE//Engineering Science"
      ]
    },
    {
      "name": "Physics abroad",
      "title": None,
      "id": None,
      "dist_area": None,
      "external": True,
      "settled": [
        "Major//2018//ECE//Breadth//PHY 208 and PHY 305"
      ]
    },
    {
      "name": "ECE 301",
      "title": "Designing Real Systems",
      "id": "1184012341",
      "dist_area": None,
      "settled": [

      ]
    },
    {
      "name": "ECE 302",
      "title": "Building Real Systems",
      "id": "1184012341",
      "dist_area": None,
      "settled": [

      ]
    },
    {
      "name": "ECE 208",
      "title": "Electronic and Photonic Devices",
      "id": "1184012341",
      "dist_area": None,
      "settled": [

      ]
    }
  ],
  [
    {
      "name": "ART 213",
      "title": "Modernist Art: 1900 to 1950",
      "id": "1184021312",
      "dist_area": "LA"
    },
    {
      "name": "ECE 498",
      "title": "Senior Thesis",
      "id": "1184002087",
      "dist_area": None
    },
    {
      "name": "PHI 203",
      "title": "Introduction to Metaphysics and Epistemology",
      "id": "1184042326",
      "dist_area": "EC"
    },
    {
      "name": "CWR 203",
      "title": "Creative Writing (Fiction)",
      "id": "1184021696",
      "dist_area": "LA"
    }
  ],
  [
    {
      "name": "CBE 245",
      "title": "Introduction to Chemical Engineering Principles",
      "id": "1184022794",
      "dist_area": "STN"
    }
  ],
  [
    {
      "name": "CBE 246",
      "title": "Thermodynamics",
      "id": "1184042768",
      "dist_area": "STN"
    },
    {
      "name": "CBE 250",
      "title": "Separations in Chemical Engineering and Biotechnology",
      "id": "1184022796",
      "dist_area": "STN"
    },
    {
      "name": "POL 345",
      "title": "",
      "id": "",
      "dist_area": "",
      "settled": [
        "Major//2018//SPI//Prerequisites//Statistics Prerequisite"
      ]
    },
    {
      "name": "ECO 300",
      "title": "",
      "id": "",
      "dist_area": "SA",
      "settled": [
        "Major//2018//SPI//Prerequisites//Microeconomics Prerequisite",
        "Major//2018//SPI//Core//Microeconomics"
      ]
    },
    {
      "name": "HIS 382",
      "title": "History of Very Real Things",
      "id": "",
      "dist_area": "HA"
    }
  ]
]

main()
