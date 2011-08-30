"""
This file demonstrates two different styles of tests (one doctest and one
unittest). These will both pass when you run "manage.py test".

Replace these with more appropriate tests for your application.
"""

from django.utils import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
import unittest
import time
import re
import sys

class SimpleTest(unittest.TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.failUnlessEqual(1 + 1, 2)

# The following tests all require that the webapp actually is running.

class Case1(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.implicitly_wait(30)
        # Note: the base_url mechanism doesn't seem to work, so I'm using driver.get() with full URLs for now.
        # self.base_url = "http://en.wikipedia.org/"
        self.verificationErrors = []
    
    def test_case1(self):
        driver = self.driver
        driver.get("http://127.0.0.1:8000")
        # driver.find_element_by_link_text("Main Page").click()
    
    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException, e: return False
        return True
    
    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)


