import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Course from '../models/Course.js';
import Level from '../models/Level.js';
import Module from '../models/Module.js';
import Quiz from '../models/Quiz.js';
import CodingProblem from '../models/CodingProblem.js';
import { FINAL_QUESTIONS } from './finalAssessmentQuestions.js';

// Rich per-module learning content (title, description, theory, and key question)
// Currently filled for Python; other languages fall back to generic content.
const MODULE_CONTENT = {
  python: {
    beginner: [
      // Module 1 (Theory) – Variables & Data Types
      `# Python Basic - Module 1: Variables & Data Types

**Difficulty:** Easy

**Description:**
Learn how Python stores values using variables and understand basic data types like int, float, string, and boolean.

**Theory Explanation:**
In Python, variables are created when you assign a value. Python automatically decides the data type based on the value.
Common types include integers (\`int\`), decimals (\`float\`), text (\`str\`), and true/false (\`bool\`).
Python is dynamically typed, meaning you don’t need to declare types explicitly.

**Checkpoint MCQ (conceptual):**
Which of the following is a valid variable assignment in Python?
- A) \`int x = 10\`
- B) \`x = 10\`
- C) \`var x = 10\`
- D) \`x := int(10)\`

Correct answer: **B) \`x = 10\`** (Python does not require datatype declaration; assignment is done directly using \`=\`.)`,

      // Module 2 (Theory) – Input & Output
      `# Python Basic - Module 2: Input & Output

**Difficulty:** Easy

**Description:**
Understand how to take user input and print output using Python functions.

**Theory Explanation:**
Python uses \`input()\` to take input from the user as a string.
If numeric input is required, it must be converted using \`int()\` or \`float()\`.
Output is displayed using \`print()\`. Multiple values can be printed using commas.

**Checkpoint MCQ (conceptual):**
What is the type of data returned by \`input()\` in Python?
- A) int
- B) float
- C) str
- D) bool

Correct answer: **C) \`str\`** (input always returns a string unless you convert it).`,

      // Module 3 (Theory) – Operators
      `# Python Basic - Module 3: Operators

**Difficulty:** Easy

**Description:**
Learn arithmetic, relational, and logical operators used in Python.

**Theory Explanation:**
Operators perform operations on values.
Arithmetic operators include \`+\`, \`-\`, \`*\`, \`/\`, \`//\`, \`%\`, \`**\`.
Relational operators compare values (\`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`, \`<=\`).
Logical operators combine conditions (\`and\`, \`or\`, \`not\`).
\`//\` returns the integer (floor) division result.

**Checkpoint MCQ (conceptual):**
What will be the output of \`print(7 // 2)\`?
- A) 3.5
- B) 3
- C) 4
- D) Error

Correct answer: **B) 3** (floor division returns only the integer part).`,

      // Module 4 (Theory) – Conditional Statements
      `# Python Basic - Module 4: Conditional Statements

**Difficulty:** Easy

**Description:**
Learn how Python makes decisions using if, elif, and else.

**Theory Explanation:**
Conditional statements execute code only when a condition is true.
Python uses indentation to define code blocks.
\`if\` checks the first condition, \`elif\` checks additional conditions,
and \`else\` executes if all previous conditions fail.

**Checkpoint MCQ (syntax):**
Which of the following is correct syntax?

Example of the correct one:

    if x > 5:
        print(x)

Correct choice from the original options: **C** (uses \`:\` and proper indentation).`,

      // Module 5 (Theory) – Loops
      `# Python Basic - Module 5: Loops (for & while)

**Difficulty:** Easy

**Description:**
Learn looping concepts using for-loop and while-loop.

**Theory Explanation:**
Loops repeat code multiple times.
Use a \`for\` loop when you are iterating over a known range or sequence.
Use a \`while\` loop when you want to repeat until a condition becomes false.
\`break\` exits the loop entirely; \`continue\` skips the current iteration.

**Example:**

    for i in range(3):
        print(i, end=" ")

This prints: \`0 1 2 \`.

**Checkpoint MCQ (behaviour):**
What values does \`range(3)\` generate?
- A) 1 2 3
- B) 0 1 2
- C) 0 1 2 3
- D) Error

Correct answer: **B) 0 1 2**.`,

      // Module 6 (Theory) – Strings
      `# Python Basic - Module 6: Strings

**Difficulty:** Easy

**Description:**
Understand string operations, indexing, slicing, and basic string methods.

**Theory Explanation:**
Strings are sequences of characters enclosed in quotes.
Indexing starts from 0; negative indexing accesses from the end (\`-1\` is last char).
Slicing is used to extract substrings: \`s[start:end]\`.
Strings are **immutable**, meaning they cannot be changed in-place.

**Example:**

    s = "Python"
    last_char = s[-1]   # "n"

**Checkpoint MCQ (indexing):**
What is the output of:

    s = "Python"
    print(s[-1])

- A) P
- B) y
- C) n
- D) Error

Correct answer: **C) n**.`,

      // Module 7 (Theory) – Lists & Tuples
      `# Python Basic - Module 7: Lists & Tuples

**Difficulty:** Easy

**Description:**
Learn list operations, tuple basics, and differences between mutable and immutable structures.

**Theory Explanation:**
Lists store multiple values and are **mutable** (they can be modified).
Tuples are similar to lists but **immutable** (cannot be changed after creation).
Lists use square brackets \`[ ]\` while tuples use parentheses \`( )\`.
Common list methods include \`.append()\`, \`.pop()\`, and \`.sort()\`.

**Checkpoint MCQ (immutability):**
Which of the following is immutable?
- A) list
- B) dict
- C) tuple
- D) set

Correct answer: **C) tuple**.`,

      // Module 8 (Program) – Print Hello World
      `# Python Basic - Module 8: Print Hello World

**Difficulty:** Easy

**Problem Statement:**
Write a program that prints \`Hello, World!\` exactly as shown.

**Input Format:**
No input.

**Output Format:**

    Hello, World!

**Key ideas:**
- Use the \`print()\` function.
- Ensure the string matches exactly, including capitalization and punctuation.`,

      // Module 9 (Program) – Sum of Two Numbers
      `# Python Basic - Module 9: Sum of Two Numbers

**Difficulty:** Easy

**Problem Statement:**
Given two integers \`a\` and \`b\`, read them from input and print their sum.

**Input Format:**
- First line: integer \`a\`
- Second line: integer \`b\`

**Output Format:**
- Print \`a + b\` on a single line.

**Constraints:**
\`-10^9 ≤ a, b ≤ 10^9\`.

**Example:**
Input:

    10
    20

Output:

    30`,

      // Module 10 (Program) – Even or Odd
      `# Python Basic - Module 10: Even or Odd

**Difficulty:** Easy

**Problem Statement:**
Given an integer \`n\`, print \`"Even"\` if \`n\` is even, otherwise print \`"Odd"\`.

**Input Format:**
- First line: integer \`n\`.

**Output Format:**
- Print \`Even\` or \`Odd\`.

**Example:**
Input:

    7

Output:

    Odd

**Hint:**
Use the modulo operator: \`n % 2 == 0\` means \`n\` is even.`,
    ],
    intermediate: [
      // Module 1 – Functions & Return Values
      `# Python Intermediate - Module 1: Functions & Return Values

**Difficulty:** Medium

**Description:**
Learn how to define reusable functions, pass parameters, and return values properly in Python.

**Theory Explanation:**
Functions are defined using the \`def\` keyword and help with code reuse and modularity.
They can take positional, keyword, and default parameters.
A function can return one value or multiple values (commonly via a tuple).
If there is no \`return\` statement, the function returns \`None\` by default.

**Checkpoint MCQ (behaviour):**
What will be the output?

    def fun(x):
        return x * 2

    print(fun(5))

- A) 5
- B) 10
- C) 25
- D) None

Correct answer: **B) 10** (the function returns \`5 * 2\`).`,

      // Module 2 – Dictionary Operations
      `# Python Intermediate - Module 2: Dictionary Operations

**Difficulty:** Medium

**Description:**
Understand how dictionaries work and how to access, update, and iterate through key-value pairs.

**Theory Explanation:**
A dictionary stores data as key–value pairs.
Keys must be unique and immutable; values can be any type.
Common methods: \`.get(key, default)\`, \`.keys()\`, \`.values()\`, \`.items()\`.
Dictionaries are often used for frequency counting and lookup tables.

**Checkpoint MCQ (get with default):**

    d = {"a": 10, "b": 20}
    print(d.get("c", 0))

What is printed?
- A) None
- B) 0
- C) Error
- D) "c"

Correct answer: **B) 0**.`,

      // Module 3 – Time Complexity Basics
      `# Python Intermediate - Module 3: Time Complexity Basics

**Difficulty:** Medium

**Description:**
Learn Big-O notation and identify the complexity of common loops.

**Theory Explanation:**
Time complexity measures how runtime grows with input size \`n\`.
- Single loop over \`n\` elements → **O(n)**
- Nested loop over \`n\` and \`n\` → **O(n²)**
- Binary search → **O(log n)**
- Hash-table average lookup (dict / set) → **O(1)**

**Checkpoint MCQ (nested loops):**

    for i in range(n):
        for j in range(n):
            print(i, j)

What is the time complexity?
- A) O(n)
- B) O(log n)
- C) O(n²)
- D) O(1)

Correct answer: **C) O(n²)**.`,

      // Module 4 – Sets and Membership Checking
      `# Python Intermediate - Module 4: Sets and Membership Checking

**Difficulty:** Medium

**Description:**
Learn how sets work and why they are useful in DSA problems.

**Theory Explanation:**
Sets store unique elements and are implemented using hash tables.
Checking membership in a list is O(n) in the worst case,
while checking membership in a set is O(1) on average.
Sets are useful for duplicate detection, unions, intersections, and fast lookups.

**Checkpoint MCQ (membership):**
Which operation is typically **fastest** for checking if an element exists?
- A) \`x in list\`
- B) \`x in set\`
- C) \`x in tuple\`
- D) \`x in string\`

Correct answer: **B) \`x in set\`**.`,

      // Module 5 – List Comprehension
      `# Python Intermediate - Module 5: List Comprehension

**Difficulty:** Medium

**Description:**
Learn how to create lists efficiently using list comprehension.

**Theory Explanation:**
List comprehensions provide a compact and readable way to build lists.
They can also include conditions.

Example:

    squares_of_even = [x * x for x in range(5) if x % 2 == 0]

**Checkpoint MCQ (simple comprehension):**

    nums = [1, 2, 3, 4]
    res = [x * 2 for x in nums]
    print(res)

What is printed?
- A) [2, 4, 6, 8]
- B) [1, 4, 9, 16]
- C) [1, 2, 3, 4, 2]
- D) Error

Correct answer: **A) [2, 4, 6, 8]**.`,

      // Module 6 – Find Maximum Element
      `# Python Intermediate - Module 6: Find Maximum Element

**Difficulty:** Medium

**Problem Statement:**
Given an integer array of size \`n\`, print the maximum element.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` space-separated integers.

**Output Format:**
- Print the maximum element.

**Example:**
Input:

    5
    3 7 2 9 1

Output:

    9`,

      // Module 7 – Reverse a String
      `# Python Intermediate - Module 7: Reverse a String

**Difficulty:** Medium

**Problem Statement:**
Given a string \`s\`, print its reverse.

**Input Format:**
- First line: string \`s\`.

**Output Format:**
- Print the reversed string.

**Example:**
Input:

    hello

Output:

    olleh`,

      // Module 8 – Count Frequency of Elements
      `# Python Intermediate - Module 8: Count Frequency of Elements

**Difficulty:** Medium

**Problem Statement:**
Given an array of integers, print each element with its frequency
in ascending order of the element value.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` space-separated integers.

**Output Format:**
- For each distinct number, print: \`number frequency\` on its own line.

**Example:**
Input:

    6
    1 2 2 3 3 3

Output:

    1 1
    2 2
    3 3`,

      // Module 9 – Two Sum
      `# Python Intermediate - Module 9: Two Sum

**Difficulty:** Medium

**Problem Statement:**
Given an array \`nums\` of size \`n\` and an integer \`target\`,
return (print) indices of the two numbers such that they add up to \`target\`.
Assume exactly one solution exists.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` space-separated integers (\`nums\`)
- Third line: integer \`target\`.

**Output Format:**
- Print two indices (0-based) separated by a space.

**Example:**
Input:

    4
    2 7 11 15
    9

Output:

    0 1`,

      // Module 10 – Check Palindrome Number
      `# Python Intermediate - Module 10: Check Palindrome Number

**Difficulty:** Medium

**Problem Statement:**
Given an integer \`n\`, print \`"Yes"\` if it is a palindrome, otherwise print \`"No"\`.

**Input Format:**
- First line: integer \`n\`.

**Output Format:**
- Print \`Yes\` or \`No\`.

**Example:**
Input:

    121

Output:

    Yes`,
    ],
    expert: [
      // Module 1 – Recursion and Stack Depth
      `# Python Expert - Module 1: Recursion and Stack Depth

**Difficulty:** Hard

**Description:**
Understand recursion, recursion base case, stack overflow issues,
and when recursion is useful in DSA.

**Theory Explanation:**
Recursion is when a function calls itself.
Every recursive function must have a **base case** so that it eventually stops.
Each recursive call is stored in the call stack; if the recursion is too deep,
Python raises a \`RecursionError\` (default limit is around 1000 calls).
Recursion is useful in tree traversal, backtracking, and divide-and-conquer algorithms.

**Checkpoint MCQ (error type):**
What happens when we run:

    def fun():
        return fun()

    fun()

- A) Prints None
- B) Infinite loop but no error
- C) RecursionError occurs
- D) Syntax Error

Correct answer: **C) RecursionError occurs**.`,

      // Module 2 – Heap vs Stack Memory
      `# Python Expert - Module 2: Heap vs Stack Memory

**Difficulty:** Hard

**Description:**
Learn how Python stores objects in memory and understand its reference-based model.

**Theory Explanation:**
Most Python objects live on the **heap**, and variables hold **references** to these objects.
The **stack** is used for function calls and local variable references.
Mutable objects like lists and dictionaries can be modified through any reference pointing to them.
Understanding this is crucial for reasoning about side effects and aliasing.

**Example:**

    a = [1, 2, 3]
    b = a
    b.append(4)
    # Both a and b now refer to [1, 2, 3, 4]

Correct conceptual answer: printing \`a\` shows **[1, 2, 3, 4]**.`,

      // Module 3 – Hashing & Collision Handling
      `# Python Expert - Module 3: Hashing & Collision Handling

**Difficulty:** Hard

**Description:**
Understand hashing, collisions, and how Python dictionaries achieve fast performance.

**Theory Explanation:**
Hashing converts keys into integer hash values.
Dictionaries and sets use hash tables under the hood.
When two keys hash to the same bucket, a **collision** occurs.
Python resolves collisions using internal probing and resizing strategies.
Average complexity for lookup, insert, and delete remains **O(1)**, but worst case can degrade.

**Checkpoint MCQ (hash-based DS):**
Which built-in Python data structure uses hashing internally?
- A) list
- B) tuple
- C) set
- D) string

Correct answer: **C) set**.`,

      // Module 4 – Binary Search
      `# Python Expert - Module 4: Binary Search

**Difficulty:** Hard

**Problem Statement:**
Given a sorted array of integers and a target value,
return the index of the target if found, otherwise return \`-1\`.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` space-separated integers (sorted ascending)
- Third line: integer \`target\`.

**Output Format:**
- Print index of target (0-based), else \`-1\`.

**Example:**
Input:

    6
    1 3 5 7 9 11
    7

Output:

    3`,

      // Module 5 – Merge Two Sorted Arrays
      `# Python Expert - Module 5: Merge Two Sorted Arrays

**Difficulty:** Hard

**Problem Statement:**
Given two sorted arrays \`A\` and \`B\`, merge them into a single sorted array.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` sorted integers (array A)
- Third line: integer \`m\`
- Fourth line: \`m\` sorted integers (array B)

**Output Format:**
- Print the merged sorted array in one line.

**Example:**
Input:

    4
    1 3 5 7
    3
    2 4 6

Output:

    1 2 3 4 5 6 7`,

      // Module 6 – Longest Common Prefix
      `# Python Expert - Module 6: Longest Common Prefix

**Difficulty:** Hard

**Problem Statement:**
Given \`n\` strings, find the longest common prefix among all strings.
If there is no common prefix, print \`"None"\`.

**Input Format:**
- First line: integer \`n\`
- Next \`n\` lines: one string per line.

**Output Format:**
- Print the longest common prefix, or \`None\` if none exists.

**Example:**
Input:

    3
    flower
    flow
    flight

Output:

    fl`,

      // Module 7 – Valid Parentheses
      `# Python Expert - Module 7: Valid Parentheses

**Difficulty:** Hard

**Problem Statement:**
Given a string containing only the characters \`()[]{}`\`,
determine if the string is valid.
A string is valid if:
- Open brackets are closed by the same type of brackets.
- Brackets are closed in the correct order.

**Input Format:**
- First line: string \`s\`.

**Output Format:**
- Print \`Valid\` if the string is correct, otherwise \`Invalid\`.

**Example:**
Input:

    {[()]}

Output:

    Valid`,

      // Module 8 – Find Duplicate Number
      `# Python Expert - Module 8: Find Duplicate Number

**Difficulty:** Hard

**Problem Statement:**
Given an array of size \`n+1\` containing integers from \`1\` to \`n\`,
only one number is repeated. Print the duplicate number.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n+1\` integers.

**Output Format:**
- Print the duplicate number.

**Example:**
Input:

    4
    1 3 4 2 2

Output:

    2`,

      // Module 9 – Rotate Array
      `# Python Expert - Module 9: Rotate Array

**Difficulty:** Hard

**Problem Statement:**
Given an array of size \`n\` and an integer \`k\`,
rotate the array to the right by \`k\` positions.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` space-separated integers
- Third line: integer \`k\`.

**Output Format:**
- Print the rotated array.

**Example:**
Input:

    5
    1 2 3 4 5
    2

Output:

    4 5 1 2 3`,

      // Module 10 – Maximum Subarray Sum (Kadane)
      `# Python Expert - Module 10: Maximum Subarray Sum (Kadane Algorithm)

**Difficulty:** Hard

**Problem Statement:**
Given an integer array, find the contiguous subarray with the largest sum
and print that sum.

**Input Format:**
- First line: integer \`n\`
- Second line: \`n\` space-separated integers.

**Output Format:**
- Print the maximum subarray sum.

**Example:**
Input:

    9
    -2 1 -3 4 -1 2 1 -5 4

Output:

    6

**Hint:**
Kadane's algorithm maintains a running best prefix ending at each position.`,
    ],
  },
  java: {
    beginner: [
      `# Java Basic - Module 1: Java Introduction & Syntax

**Difficulty:** Easy

**Description:**
Learn basic Java program structure, the \`main\` method, and compilation/execution on the JVM.

**Theory:**
Every Java program has a class, and execution starts from \`public static void main(String[] args)\`.
Java source is compiled into bytecode (\`.class\`) and run by the JVM, making it platform independent.`,

      `# Java Basic - Module 2: Variables & Data Types

**Difficulty:** Easy

**Description:**
Understand primitive data types like \`int\`, \`double\`, \`char\`, \`boolean\` and how Java is statically typed.

**Theory:**
Every variable must declare a data type. Primitive types store simple values, and reference types (like \`String\`) store references to objects.`,

      `# Java Basic - Module 3: Operators

**Difficulty:** Easy

**Description:**
Learn arithmetic, relational, logical, and assignment operators in Java.

**Theory:**
Operators operate on operands (e.g. \`+ - * / %\`, \`== != > <\`, \`&& || !\`). Integer division like \`10/3\` yields \`3\` (fraction truncated).`,

      `# Java Basic - Module 4: Conditional Statements

**Difficulty:** Easy

**Description:**
Use \`if\`, \`else if\`, \`else\`, and \`switch\` to control flow.

**Theory:**
Conditions must be boolean. Syntax requires parentheses around the condition and braces for blocks, e.g. \`if (x > 5) { ... }\`.`,

      `# Java Basic - Module 5: Loops (for, while, do-while)

**Difficulty:** Easy

**Description:**
Explore \`for\`, \`while\`, and \`do-while\` loops.

**Theory:**
Use \`for\` when the number of iterations is known, \`while\` when checking before each iteration, and \`do-while\` when the loop must run at least once.`,

      `# Java Basic - Module 6: Arrays

**Difficulty:** Easy

**Description:**
Store multiple values of the same type using arrays.

**Theory:**
Arrays are fixed-size objects with 0-based indices and a \`.length\` property, e.g. \`int[] arr = {10,20,30};\`.`,

      `# Java Basic - Module 7: OOP Basics (Class & Object)

**Difficulty:** Easy

**Description:**
Learn what classes and objects are in Java.

**Theory:**
A class is a blueprint; an object is an instance. Objects encapsulate fields and methods. Java is object-oriented by design.`,

      `# Java Basic - Module 8: Print Hello World

**Difficulty:** Easy

**Problem:**
Print \`Hello, World!\` exactly.

**Key Idea:**
Use a Java class with a \`main\` method and \`System.out.println("Hello, World!");\`.`,

      `# Java Basic - Module 9: Sum of Two Numbers

**Difficulty:** Easy

**Problem:**
Read two integers \`a\` and \`b\` from input and print their sum.

**Format:**
First line \`a\`, second line \`b\`; output \`a + b\`.`,

      `# Java Basic - Module 10: Even or Odd

**Difficulty:** Easy

**Problem:**
Given integer \`n\`, print \`Even\` if \`n\` is even, else \`Odd\`.

**Hint:**
Use \`n % 2 == 0\` check inside an \`if\` statement.`,
    ],
    intermediate: [
      `# Java Intermediate - Module 1: Methods & Function Overloading

**Difficulty:** Medium

**Description:**
Learn Java methods and method overloading.

**Theory:**
Methods are reusable blocks of code. Overloading lets you define multiple methods with the same name but different parameter lists (type/count/order). Return type alone cannot distinguish overloads.`,

      `# Java Intermediate - Module 2: String vs StringBuilder

**Difficulty:** Medium

**Description:**
Understand immutability of \`String\` and efficiency of \`StringBuilder\`.

**Theory:**
\`String\` objects are immutable; concatenation in loops creates many objects. \`StringBuilder\` is mutable and preferred for repeated modifications.`,

      `# Java Intermediate - Module 3: HashMap Basics

**Difficulty:** Medium

**Description:**
Use \`HashMap\` for key–value storage.

**Theory:**
HashMap offers average O(1) insertion and lookup via hashing. Keys must be unique; common in frequency counting and two-sum style problems.`,

      `# Java Intermediate - Module 4: Time Complexity & Big-O

**Difficulty:** Medium

**Description:**
Analyze time complexity of common patterns.

**Theory:**
Single loop → O(n), nested loops → O(n²), binary search → O(log n), typical HashMap \`.get()\` → O(1) average.`,

      `# Java Intermediate - Module 5: Stack & Queue Basics

**Difficulty:** Medium

**Description:**
Understand stacks (LIFO) and queues (FIFO) and their use cases.

**Theory:**
Stacks support push/pop and are used for recursion and parentheses checking. Queues support enqueue/dequeue and are used in scheduling and BFS.`,

      `# Java Intermediate - Module 6: Find Maximum in Array

**Difficulty:** Medium

**Problem:**
Given an integer array of size \`n\`, print the maximum element.

**Format:**
First line \`n\`, second line \`n\` integers; output max value.`,

      `# Java Intermediate - Module 7: Reverse a String

**Difficulty:** Medium

**Problem:**
Read a string \`s\` and print its reverse.

**Hint:**
Traverse from end to start, or use \`StringBuilder(s).reverse()\`.`,

      `# Java Intermediate - Module 8: Two Sum

**Difficulty:** Medium

**Problem:**
Given \`n\`, array \`nums\`, and \`target\`, print indices of two numbers (0-based) whose sum equals \`target\`. Exactly one solution exists.`,

      `# Java Intermediate - Module 9: Check Palindrome String

**Difficulty:** Medium

**Problem:**
Given string \`s\`, print \`Yes\` if \`s\` is palindrome, else \`No\`.`,

      `# Java Intermediate - Module 10: Count Frequency of Elements

**Difficulty:** Medium

**Problem:**
Given an array, print each distinct element and its frequency in ascending order of element.

**Hint:**
Use \`HashMap<Integer,Integer>\` to count, then sort keys.`,
    ],
    expert: [
      `# Java Expert - Module 1: Recursion & Stack Overflow

**Difficulty:** Hard

**Description:**
Deepen understanding of recursion and the call stack.

**Theory:**
Recursive methods must have a base case. Infinite recursion grows stack frames until \`StackOverflowError\` occurs.`,

      `# Java Expert - Module 2: OOP Concepts (Inheritance & Polymorphism)

**Difficulty:** Hard

**Description:**
Explore inheritance and runtime polymorphism.

**Theory:**
\`extends\` allows a subclass to inherit fields and methods. Overriding methods enables dynamic dispatch: the implementation is chosen based on the runtime type.`,

      `# Java Expert - Module 3: Hashing & Collision

**Difficulty:** Hard

**Description:**
Understand how \`HashMap\` uses hashing and handles collisions.

**Theory:**
Keys are mapped to buckets via hash codes. Collisions are handled using buckets (lists or trees). Average \`.get()\` is O(1), but worst case can degrade to O(n).`,

      `# Java Expert - Module 4: Binary Search

**Difficulty:** Hard

**Problem:**
Given sorted array and target, print index (0-based) if target exists, else -1.`,

      `# Java Expert - Module 5: Merge Two Sorted Arrays

**Difficulty:** Hard

**Problem:**
Given two sorted arrays, merge them into one sorted array and print the result.`,

      `# Java Expert - Module 6: Valid Parentheses

**Difficulty:** Hard

**Problem:**
Given a string of \`()[]{}`\`, print \`Valid\` if brackets are properly matched and ordered, else \`Invalid\`. Use a stack.`,

      `# Java Expert - Module 7: Maximum Subarray Sum (Kadane)

**Difficulty:** Hard

**Problem:**
Given an array, print the maximum sum of any contiguous subarray (Kadane's algorithm).`,

      `# Java Expert - Module 8: Rotate Array Right

**Difficulty:** Hard

**Problem:**
Given \`n\`, array, and integer \`k\`, rotate the array to the right by \`k\` steps and print the result.`,

      `# Java Expert - Module 9: Longest Common Prefix

**Difficulty:** Hard

**Problem:**
Given \`n\` strings, print their longest common prefix or \`None\` if there is none.`,

      `# Java Expert - Module 10: Find Duplicate Number

**Difficulty:** Hard

**Problem:**
Given array of size \`n+1\` with numbers 1..n and exactly one duplicate, print the duplicate number.`,
    ],
  },
  cpp: {
    beginner: [
      `# C++ Basic - Module 1: Introduction to C++ & Syntax

**Difficulty:** Easy

**Description:**
Learn the basic structure of a C++ program and how execution starts at \`int main()\`.

**Theory:**
Use \`#include <iostream>\` for I/O and \`using namespace std;\` to access \`cin\` and \`cout\` without \`std::\`.`,

      `# C++ Basic - Module 2: Variables and Data Types

**Difficulty:** Easy

**Description:**
Understand C++ primitive types: \`int\`, \`float\`, \`double\`, \`char\`, \`bool\`.

**Theory:**
C++ is statically typed; variables must be declared with a type before use.`,

      `# C++ Basic - Module 3: Input and Output (cin/cout)

**Difficulty:** Easy

**Description:**
Use \`cin\` and \`cout\` for standard input and output.

**Theory:**
\`>>\` is the extraction operator; \`<<\` is the insertion operator. Use \`endl\` or \'\n\' for newlines.`,

      `# C++ Basic - Module 4: Operators

**Difficulty:** Easy

**Description:**
Learn arithmetic, relational, and logical operators in C++.

**Theory:**
Includes \`+\`, \`-\`, \`*\`, \`/\`, \`%\`, comparison operators, and logical \`&&\`, \`||\`, \`!\`. \`%\` works on integers only.`,

      `# C++ Basic - Module 5: Conditional Statements

**Difficulty:** Easy

**Description:**
Use \`if\`, \`else if\`, \`else\`, and \`switch\` for branching.

**Theory:**
Conditions go in parentheses, blocks in braces, e.g. \`if (x > 5) { ... }\`.`,

      `# C++ Basic - Module 6: Loops (for, while, do-while)

**Difficulty:** Easy

**Description:**
Learn iterative constructs in C++.

**Theory:**
\`for\` is ideal when you know iteration count; \`while\` checks before each iteration; \`do-while\` executes at least once.`,

      `# C++ Basic - Module 7: Arrays

**Difficulty:** Easy

**Description:**
Store multiple values of the same type in a fixed-size array.

**Theory:**
Arrays are contiguous in memory with 0-based indices, e.g. \`int arr[5];\`.`,

      `# C++ Basic - Module 8: Print Hello World

**Difficulty:** Easy

**Problem:**
Write a C++ program that prints \`Hello, World!\` using \`cout\`.`,

      `# C++ Basic - Module 9: Sum of Two Numbers

**Difficulty:** Easy

**Problem:**
Read two integers \`a\` and \`b\` from input and output their sum.`,

      `# C++ Basic - Module 10: Even or Odd

**Difficulty:** Easy

**Problem:**
Given integer \`n\`, output \`Even\` if \`n\` is even, else \`Odd\`.`,
    ],
    intermediate: [
      `# C++ Intermediate - Module 1: Functions & Pass by Reference

**Difficulty:** Medium

**Description:**
Learn C++ functions and difference between pass-by-value and pass-by-reference.

**Theory:**
Use \`int &x\` to pass by reference so the callee can modify the caller's variable.`,

      `# C++ Intermediate - Module 2: Pointers Basics

**Difficulty:** Medium

**Description:**
Understand pointers and memory addresses.

**Theory:**
Pointers store addresses. \`&var\` gives an address; \`*ptr\` dereferences to access the stored value.`,

      `# C++ Intermediate - Module 3: STL Vector

**Difficulty:** Medium

**Description:**
Use \`std::vector\` as a dynamic array.

**Theory:**
Supports \`.push_back()\`, \`.pop_back()\`, \`.size()\` and random access in O(1).`,

      `# C++ Intermediate - Module 4: Time Complexity & Big-O

**Difficulty:** Medium

**Description:**
Analyze time complexity for loops and STL operations.

**Theory:**
Sorting with \`std::sort\` is typically O(n log n); nested loops can be O(n²).`,

      `# C++ Intermediate - Module 5: Hashing using unordered_map

**Difficulty:** Medium

**Description:**
Use \`unordered_map\` for hash-based key–value storage.

**Theory:**
Average O(1) insert and lookup via hashing; used in many DSA problems.`,

      `# C++ Intermediate - Module 6: Reverse an Array

**Difficulty:** Medium

**Problem:**
Given \`n\` and an array, print the elements in reverse order.`,

      `# C++ Intermediate - Module 7: Find Maximum Element

**Difficulty:** Medium

**Problem:**
Given an array, print the maximum value.`,

      `# C++ Intermediate - Module 8: Two Sum

**Difficulty:** Medium

**Problem:**
Given \`n\`, array \`nums\`, and \`target\`, print indices of two elements whose sum equals \`target\` (exactly one solution).`,

      `# C++ Intermediate - Module 9: Check Palindrome String

**Difficulty:** Medium

**Problem:**
Given string \`s\`, print \`Yes\` if it is palindrome, otherwise \`No\`.`,

      `# C++ Intermediate - Module 10: Count Frequency of Elements

**Difficulty:** Medium

**Problem:**
Given an array, print each distinct element and its frequency in ascending order.`,
    ],
    expert: [
      `# C++ Expert - Module 1: Recursion & Backtracking Basics

**Difficulty:** Hard

**Description:**
Understand recursion trees and backtracking strategies.

**Theory:**
Backtracking tries options recursively and undoes choices on dead ends; used for permutations, N-Queens, etc.`,

      `# C++ Expert - Module 2: Binary Search Concept

**Difficulty:** Hard

**Description:**
Use binary search on sorted arrays.

**Theory:**
Halves the search space each step, giving O(log n) time complexity.`,

      `# C++ Expert - Module 3: Priority Queue (Heap)

**Difficulty:** Hard

**Description:**
Use \`std::priority_queue\` backed by a heap.

**Theory:**
Default is a max-heap; pushing and popping are O(log n) and returning the largest element is O(1).`,

      `# C++ Expert - Module 4: Binary Search in Sorted Array

**Difficulty:** Hard

**Problem:**
Given sorted array and target, print its index or -1 if not found.`,

      `# C++ Expert - Module 5: Maximum Subarray Sum (Kadane)

**Difficulty:** Hard

**Problem:**
Given an array, print the maximum sum over all contiguous subarrays.`,

      `# C++ Expert - Module 6: Merge Intervals

**Difficulty:** Hard

**Problem:**
Given intervals \`[start, end]\`, merge all overlapping intervals and print merged list.`,

      `# C++ Expert - Module 7: Valid Parentheses

**Difficulty:** Hard

**Problem:**
Given a bracket string \`()[]{}`\`, print \`Valid\` if properly nested, else \`Invalid\`.`,

      `# C++ Expert - Module 8: Rotate Array Right

**Difficulty:** Hard

**Problem:**
Rotate the array right by \`k\` positions and print the result.`,

      `# C++ Expert - Module 9: Longest Common Prefix

**Difficulty:** Hard

**Problem:**
Given \`n\` strings, print their longest common prefix, or \`None\` if there is none.`,

      `# C++ Expert - Module 10: Find Duplicate Number

**Difficulty:** Hard

**Problem:**
Given array size \`n+1\` with values 1..n and a single duplicate, print the duplicate.`,
    ],
  },
  javascript: {
    beginner: [
      `# JavaScript Basic - Module 1: Variables (var, let, const)

**Difficulty:** Easy

**Description:**
Learn how variables work in JS and the differences between \`var\`, \`let\`, and \`const\`.

**Theory:**
\`var\` is function-scoped; \`let\` and \`const\` are block-scoped. \`const\` cannot be reassigned.`,

      `# JavaScript Basic - Module 2: Data Types

**Difficulty:** Easy

**Description:**
Understand JS primitive types and objects.

**Theory:**
Primitive: \`number\`, \`string\`, \`boolean\`, \`null\`, \`undefined\`, \`symbol\`, \`bigint\`.
Objects cover arrays, functions, plain objects. Note: \`typeof null === "object"\` (quirk).`,

      `# JavaScript Basic - Module 3: Operators

**Difficulty:** Easy

**Description:**
Learn arithmetic, comparison, and logical operators.

**Theory:**
\`==\` does loose equality (with type coercion); \`===\` is strict equality (no coercion) and is preferred.`,

      `# JavaScript Basic - Module 4: Conditional Statements

**Difficulty:** Easy

**Description:**
Use \`if/else\` and \`switch\` for branching logic.

**Theory:**
Conditions are truthy/falsy. \`switch\` is handy for many discrete cases on one expression.`,

      `# JavaScript Basic - Module 5: Loops

**Difficulty:** Easy

**Description:**
Use \`for\`, \`while\`, and \`do-while\` loops.

**Theory:**
\`do-while\` always runs once before checking the condition.`,

      `# JavaScript Basic - Module 6: Functions

**Difficulty:** Easy

**Description:**
Define functions and arrow functions.

**Theory:**
Traditional: \`function add(a,b){...}\`; Arrow: \`const add = (a,b) => a+b;\`. Arrow functions capture \`this\` lexically.`,

      `# JavaScript Basic - Module 7: Arrays Basics

**Difficulty:** Easy

**Description:**
Work with arrays and core methods.

**Theory:**
Common: \`.push()\`, \`.pop()\`, \`.shift()\`, \`.unshift()\`, \`.length\`.`,

      `# JavaScript Basic - Module 8: Print Hello World

**Difficulty:** Easy

**Problem:**
Print \`Hello World\` to the console using \`console.log("Hello World");\`.`,

      `# JavaScript Basic - Module 9: Sum of Two Numbers

**Difficulty:** Easy

**Problem:**
Read two integers and print their sum (e.g. via Node.js stdin or an online judge signature).`,

      `# JavaScript Basic - Module 10: Check Even or Odd

**Difficulty:** Easy

**Problem:**
Given \`n\`, print \`Even\` if \`n % 2 === 0\`, else \`Odd\`.`,
    ],
    intermediate: [
      `# JavaScript Intermediate - Module 1: Array Methods (map, filter, reduce)

**Difficulty:** Medium

**Description:**
Use \`.map()\`, \`.filter()\`, and \`.reduce()\` for expressive array transformations.

**Theory:**
- \`map\` transforms each element and returns a new array.
- \`filter\` keeps elements that satisfy a predicate.
- \`reduce\` accumulates to a single value (e.g. sum).`,

      `# JavaScript Intermediate - Module 2: Objects and Hashing

**Difficulty:** Medium

**Description:**
Use JS objects as hash maps.

**Theory:**
Objects store key–value pairs; access via \`obj.key\` or \`obj["key"]\`. Used heavily for frequency maps and lookups.`,

      `# JavaScript Intermediate - Module 3: String Operations

**Difficulty:** Medium

**Description:**
Work with strings, \`.split()\`, \`.join()\`, and substrings.

**Theory:**
Strings are immutable. \`"a-b-c".split("-")\` yields \`["a","b","c"]\`.`,

      `# JavaScript Intermediate - Module 4: Time Complexity in DSA

**Difficulty:** Medium

**Description:**
Reason about Big-O for JS algorithms.

**Theory:**
Single loop → O(n), nested loops → O(n²), binary search → O(log n), sort → typically O(n log n).`,

      `# JavaScript Intermediate - Module 5: Stack and Queue Basics

**Difficulty:** Medium

**Description:**
Represent stacks and queues using arrays.

**Theory:**
Stack (LIFO) via \`push/pop\`; Queue (FIFO) via \`push/shift\` or a proper queue implementation.`,

      `# JavaScript Intermediate - Module 6: Reverse a String

**Difficulty:** Medium

**Problem:**
Given string \`s\`, print its reverse (e.g. \`s.split("").reverse().join("")\`).`,

      `# JavaScript Intermediate - Module 7: Find Maximum in Array

**Difficulty:** Medium

**Problem:**
Given \`n\` and an array, print the maximum value (e.g. loop or \`Math.max(...arr)\`).`,

      `# JavaScript Intermediate - Module 8: Count Frequency of Characters

**Difficulty:** Medium

**Problem:**
Given lowercase string \`s\`, print each character and its count in alphabetical order.`,

      `# JavaScript Intermediate - Module 9: Two Sum

**Difficulty:** Medium

**Problem:**
Given array \`nums\` and \`target\`, print indices of two numbers that sum to \`target\` (exactly one solution).`,

      `# JavaScript Intermediate - Module 10: Check Palindrome

**Difficulty:** Medium

**Problem:**
Given string \`s\`, print \`Yes\` if palindrome, else \`No\`.`,
    ],
    expert: [
      `# JavaScript Expert - Module 1: Recursion & Call Stack

**Difficulty:** Hard

**Description:**
Understand recursion in JS and how the call stack behaves.

**Theory:**
Each function call is pushed onto the stack; deep or infinite recursion can overflow it. Always define base cases.`,

      `# JavaScript Expert - Module 2: Sliding Window Technique

**Difficulty:** Hard

**Description:**
Use sliding windows to optimize subarray/substring problems from O(n²) to O(n).

**Theory:**
Maintain a moving window with two pointers, expanding and shrinking while tracking required conditions.`,

      `# JavaScript Expert - Module 3: Binary Search on Answer

**Difficulty:** Hard

**Description:**
Apply binary search over the space of answers instead of array indices.

**Theory:**
Requires a monotonic predicate (once true, always true or vice versa) over an ordered domain of candidate answers.`,

      `# JavaScript Expert - Module 4: Longest Subarray Sum = K

**Difficulty:** Hard

**Problem:**
Given \`n\`, array, and \`k\`, find the length of the longest subarray whose sum equals \`k\`.`,

      `# JavaScript Expert - Module 5: Valid Parentheses

**Difficulty:** Hard

**Problem:**
Given a bracket string \`()[]{}`\`, print \`Valid\` if balanced using stack logic, else \`Invalid\`.`,

      `# JavaScript Expert - Module 6: Merge Intervals

**Difficulty:** Hard

**Problem:**
Given \`n\` intervals, merge overlapping ones and output the merged list.`,

      `# JavaScript Expert - Module 7: Find Peak Element

**Difficulty:** Hard

**Problem:**
Given array with neighbors not equal, find index of any peak element using binary search.`,

      `# JavaScript Expert - Module 8: Maximum Subarray Sum (Kadane)

**Difficulty:** Hard

**Problem:**
Given array, print maximum contiguous subarray sum (Kadane).`,

      `# JavaScript Expert - Module 9: Longest Common Prefix

**Difficulty:** Hard

**Problem:**
Given \`n\` strings, print their longest common prefix or \`None\`.`,

      `# JavaScript Expert - Module 10: Find Duplicate Number

**Difficulty:** Hard

**Problem:**
Given \`n+1\` integers with values 1..n and a single duplicate, print the duplicate.`,
    ],
  },
};

const COMMON_INTERMEDIATE = [
  {
    title: 'Module 1: Arrays & Strings',
    bullets: ['1D & 2D arrays', 'String operations'],
    prompt: 'Create a code environment to practice array and string operations.',
  },
  {
    title: 'Module 2: Data Structures',
    bullets: ['Stack', 'Queue', 'Linked List'],
    prompt: 'Set up an environment demonstrating basic data structures.',
  },
  {
    title: 'Module 3: Searching Algorithms',
    bullets: ['Linear Search', 'Binary Search'],
    prompt: 'Build a demo environment to compare searching techniques.',
  },
  {
    title: 'Module 4: Sorting Algorithms',
    bullets: ['Bubble Sort', 'Selection Sort', 'Insertion Sort'],
    prompt: 'Create a code environment to visualize sorting algorithms.',
  },
  {
    title: 'Module 5: Recursion & Complexity',
    bullets: ['Recursion basics', 'Time & space complexity'],
    prompt: 'Prepare an environment demonstrating recursive solutions and complexity analysis.',
  },
];

const COMMON_EXPERT = [
  {
    title: 'Module 1: Advanced Algorithms',
    bullets: ['Divide & Conquer', 'Greedy Algorithms'],
    prompt: 'Create a code environment to implement advanced algorithms with examples.',
  },
  {
    title: 'Module 2: Graph Algorithms',
    bullets: ['BFS & DFS', 'Shortest path concepts'],
    prompt: 'Set up an environment demonstrating graph traversal algorithms.',
  },
  {
    title: 'Module 3: Problem Solving & Practice',
    bullets: ['Competitive programming mindset', 'Optimization strategies', 'Real-world algorithmic problems'],
    prompt: 'Create a coding environment focused on solving real-world algorithmic challenges.',
  },
];

const BEGINNER_SYLLABUS = {
  python: [
    {
      title: 'Module 1: Introduction & Syntax Basics',
      bullets: ['What is Python, features, use cases', 'Python keywords and identifiers', 'Indentation rules', 'Comments and documentation strings'],
      prompt: 'Create a Python code environment that demonstrates basic syntax rules, comments, and indentation using simple examples.',
      sampleCode: 'print("Hello, Python")\n# This is a comment\nif True:\n    print("Indented block")',
    },
    {
      title: 'Module 2: Print Statement & Variables',
      bullets: ['print() function', 'Variables and dynamic typing', 'Multiple assignment', 'Basic input using input()'],
      prompt: 'Set up a Python environment to demonstrate print statements, user input, and variable assignments.',
      sampleCode: 'name = input("Enter name: ")\nage = 20\nprint("Hello", name, "age", age)',
    },
    {
      title: 'Module 3: Data Types & Type Conversion',
      bullets: ['int, float, string, bool', 'Type casting', 'type() function'],
      prompt: 'Create a Python demo showing different data types and explicit type conversions.',
      sampleCode: 'x = "42"\nprint(type(x))\nprint(int(x) + 8)',
    },
    {
      title: 'Module 4: Conditional Statements',
      bullets: ['if, elif, else', 'Nested conditions', 'Logical operators'],
      prompt: 'Build a Python program to demonstrate conditional logic using real-world examples like grading systems.',
      sampleCode: 'score = 82\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelse:\n    grade = "C"\nprint(grade)',
    },
    {
      title: 'Module 5: Loops',
      bullets: ['for loop', 'while loop', 'break, continue, pass'],
      prompt: 'Create a Python demo environment to show loop execution and control statements.',
      sampleCode: 'for i in range(3):\n    if i == 1:\n        continue\n    print(i)',
    },
    {
      title: 'Module 6: Basic Functions',
      bullets: ['Defining functions', 'Parameters and return values', 'Scope basics'],
      prompt: 'Prepare a Python environment to demonstrate function creation and function calls.',
      sampleCode: 'def add(a, b):\n    return a + b\nprint(add(2, 3))',
    },
    {
      title: 'Module 7: Basic Error Handling',
      bullets: ['Syntax vs runtime errors', 'try-except', 'Common beginner mistakes'],
      prompt: 'Create a Python code environment that demonstrates error handling with try-except blocks.',
      sampleCode: 'try:\n    x = int("abc")\nexcept ValueError:\n    print("Invalid number")',
    },
  ],
  javascript: [
    {
      title: 'Module 1: JavaScript Basics & Syntax',
      bullets: ['JavaScript role in web', 'Syntax rules', 'Comments'],
      prompt: 'Create a JavaScript environment to demonstrate basic syntax and comments.',
      sampleCode: '// JS comment\nconsole.log("Hello JS")',
    },
    {
      title: 'Module 2: Console Output & Variables',
      bullets: ['console.log()', 'var, let, const', 'Dynamic typing'],
      prompt: 'Set up a JS environment demonstrating variable declarations and console output.',
      sampleCode: 'let name = "Ava";\nconst year = 2026;\nconsole.log(name, year)',
    },
    {
      title: 'Module 3: Data Types',
      bullets: ['Primitive types', 'Type coercion', 'typeof'],
      prompt: 'Build a JavaScript demo to explore data types and type checking.',
      sampleCode: 'console.log(typeof 42, typeof "hi", typeof true)',
    },
    {
      title: 'Module 4: Conditional Statements',
      bullets: ['if, else if, else', 'Comparison operators'],
      prompt: 'Create a JS program demonstrating conditional execution.',
      sampleCode: 'const score = 75;\nif (score >= 90) console.log("A");\nelse if (score >= 70) console.log("B");\nelse console.log("C");',
    },
    {
      title: 'Module 5: Loops',
      bullets: ['for, while, do-while', 'Loop control'],
      prompt: 'Set up a JavaScript environment to practice loops with examples.',
      sampleCode: 'for (let i = 0; i < 3; i++) console.log(i);',
    },
    {
      title: 'Module 6: Functions',
      bullets: ['Function declaration', 'Arrow functions', 'Parameters'],
      prompt: 'Create a JS demo showing function definitions and usage.',
      sampleCode: 'const add = (a, b) => a + b;\nconsole.log(add(2, 5));',
    },
    {
      title: 'Module 7: Basic Errors & Debugging',
      bullets: ['Common JS errors', 'try-catch', 'Console debugging'],
      prompt: 'Prepare a JavaScript debugging environment demonstrating error handling.',
      sampleCode: 'try {\n  JSON.parse("{bad}");\n} catch (e) {\n  console.error("Parse failed");\n}',
    },
  ],
  cpp: [
    {
      title: 'Module 1: Introduction & Syntax',
      bullets: ['Structure of C++ program', '#include, main()'],
      prompt: 'Create a C++ environment to demonstrate basic program structure.',
      sampleCode: '#include <iostream>\nint main() {\n  std::cout << "Hello";\n  return 0;\n}',
    },
    {
      title: 'Module 2: Input & Output',
      bullets: ['cout, cin', 'Escape sequences'],
      prompt: 'Set up a C++ demo for user input and output.',
      sampleCode: '#include <iostream>\nint main(){int a; std::cin>>a; std::cout<<a;}\n',
    },
    {
      title: 'Module 3: Data Types & Variables',
      bullets: ['Primitive types', 'Constants'],
      prompt: 'Create a C++ environment demonstrating variable declarations.',
      sampleCode: 'const double pi = 3.14; int x = 5;',
    },
    {
      title: 'Module 4: Conditional Statements',
      bullets: ['if, else', 'Nested conditions'],
      prompt: 'Build a C++ demo showcasing conditional statements.',
      sampleCode: 'int n = 10;\nif (n > 5) std::cout << "Big";\nelse std::cout << "Small";',
    },
    {
      title: 'Module 5: Loops',
      bullets: ['for, while, do-while'],
      prompt: 'Prepare a C++ environment to demonstrate loops.',
      sampleCode: 'for (int i=0;i<3;i++) std::cout<<i;',
    },
    {
      title: 'Module 6: Functions',
      bullets: ['Function declaration & definition', 'Call by value'],
      prompt: 'Create a C++ environment to demonstrate functions.',
      sampleCode: 'int add(int a,int b){return a+b;}\nint main(){std::cout<<add(2,3);} ',
    },
    {
      title: 'Module 7: Basic Errors',
      bullets: ['Compilation vs runtime errors'],
      prompt: 'Create a C++ demo showing common errors and fixes.',
      sampleCode: '/* Example: missing semicolon causes compile error */\nint x = 5',
    },
  ],
  java: [
    {
      title: 'Module 1: Java Introduction & Syntax',
      bullets: ['Java program structure', 'class and main method'],
      prompt: 'Create a Java development environment demonstrating basic program structure.',
      sampleCode: 'class Main { public static void main(String[] args){ System.out.println("Hello"); } }',
    },
    {
      title: 'Module 2: Output using System.out.println()',
      bullets: ['Console output', 'Print vs println'],
      prompt: 'Create a Java development environment demonstrating console output.',
      sampleCode: 'System.out.println("Hello Java");',
    },
    {
      title: 'Module 3: Data Types & Variables',
      bullets: ['Primitive types', 'Variable declaration'],
      prompt: 'Create a Java development environment demonstrating variables.',
      sampleCode: 'int age = 20; double pi = 3.14; boolean ok = true;',
    },
    {
      title: 'Module 4: Conditional Statements',
      bullets: ['if, else if, else', 'Comparison operators'],
      prompt: 'Create a Java development environment demonstrating conditions.',
      sampleCode: 'int score=88; if(score>=90) System.out.println("A"); else System.out.println("B");',
    },
    {
      title: 'Module 5: Loops',
      bullets: ['for, while, do-while'],
      prompt: 'Create a Java development environment demonstrating loops.',
      sampleCode: 'for(int i=0;i<3;i++){ System.out.println(i); }',
    },
    {
      title: 'Module 6: Methods',
      bullets: ['Method declaration', 'Parameters and return values'],
      prompt: 'Create a Java development environment demonstrating methods.',
      sampleCode: 'static int add(int a,int b){return a+b;}',
    },
    {
      title: 'Module 7: Basic Exceptions',
      bullets: ['try-catch', 'Runtime errors'],
      prompt: 'Create a Java development environment demonstrating exception handling.',
      sampleCode: 'try { int x = Integer.parseInt("x"); } catch(Exception e){ System.out.println("Error"); }',
    },
  ],
};

const THEORY_SYLLABUS = {
  python: { beginner: BEGINNER_SYLLABUS.python, intermediate: COMMON_INTERMEDIATE, expert: COMMON_EXPERT },
  javascript: { beginner: BEGINNER_SYLLABUS.javascript, intermediate: COMMON_INTERMEDIATE, expert: COMMON_EXPERT },
  cpp: { beginner: BEGINNER_SYLLABUS.cpp, intermediate: COMMON_INTERMEDIATE, expert: COMMON_EXPERT },
  java: { beginner: BEGINNER_SYLLABUS.java, intermediate: COMMON_INTERMEDIATE, expert: COMMON_EXPERT },
};

const languageLabel = (slug) =>
  slug === 'python' ? 'Python' : slug === 'java' ? 'Java' : slug === 'cpp' ? 'C++' : 'JavaScript';

function renderTheoryHtml({ title, bullets, prompt, sampleCode }, slug, levelName) {
  const bulletHtml = (bullets || []).map((b) => `<li>${b}</li>`).join('');
  const codeBlock = sampleCode
    ? `<pre><code>${sampleCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
    : '';
  return `
    <section class="course-section">
      <h2>${languageLabel(slug)} ${levelName} · ${title}</h2>
      <p class="course-lead">Build foundations with guided explanations and a quick hands-on test.</p>
      <h3>Key Concepts</h3>
      <ul>${bulletHtml}</ul>
      <h3>Environment Prompt</h3>
      <p>${prompt}</p>
      ${codeBlock ? `<h3>Quick Example</h3>${codeBlock}` : ''}
      <div class="course-check">
        <strong>Knowledge Check:</strong> Try modifying the example or add one more line that uses a concept from this module.
      </div>
    </section>
  `.trim();
}

function getTheoryModules(slug, levelSlug) {
  return THEORY_SYLLABUS[slug]?.[levelSlug] || [];
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in .env');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const existingAdmin = await Admin.findOne({ email: 'aparna@codenova.com' });
  if (!existingAdmin) {
    await Admin.create({
      email: 'aparna@codenova.com',
      username: 'aparna123',
      password: 'codenova321',
      name: 'Aparna Admin',
    });
    console.log('Admin created: aparna@codenova.com / codenova321 (username: aparna123)');
  }

  const courseSlugs = ['python', 'java', 'cpp', 'javascript'];
  for (const slug of courseSlugs) {
    let course = await Course.findOne({ slug });
    if (!course) {
      const courseName = slug === 'python' ? 'Python' : slug === 'java' ? 'Java' : slug === 'cpp' ? 'C++' : 'JavaScript';
      course = await Course.create({
        name: courseName,
        slug,
        description: `Learn ${courseName} programming with guided theory and practice labs.`,
        provider: 'Codenova',
        badge: 'Online Course',
        rating: 4.5,
        reviewsCount: 7800,
        enrollmentCount: 410000,
        estimatedHours: 6,
        scheduleNote: 'Flexible schedule · Learn at your own pace',
        coverImage: '',
      });
      console.log('Course created:', course.name);
    }

    for (const levelName of ['Beginner', 'Intermediate', 'Expert']) {
      const levelSlug = levelName.toLowerCase();
      let level = await Level.findOne({ course: course._id, slug: levelSlug });
      if (!level) {
        level = await Level.create({
          name: levelName,
          slug: levelSlug,
          course: course._id,
          order: levelSlug === 'beginner' ? 0 : levelSlug === 'intermediate' ? 1 : 2,
        });
        await Course.findByIdAndUpdate(course._id, { $addToSet: { levels: level._id } });
        console.log('Level created:', levelName, 'for', course.name);
      }

      // Ensure 10 learning modules per level, with theory/practice mix
      let modules = await Module.find({ level: level._id }).sort({ order: 1 });
      if (modules.length === 0) {
        const createdModules = [];
        const theoryModules = getTheoryModules(slug, level.slug);
        const totalModules = Math.max(10, theoryModules.length);
        for (let i = 0; i < totalModules; i++) {
          const theoryDef = theoryModules[i];
          const isTheory = i < theoryModules.length;
          const title = isTheory
            ? `${course.name} ${levelName} · ${theoryDef.title}`
            : `${course.name} ${levelName} · Practice Lab ${i - theoryModules.length + 1}`;
          const content = isTheory
            ? renderTheoryHtml(theoryDef, slug, levelName)
            : `<section class="course-section">
                <h2>${course.name} ${levelName} · Practice Lab ${i - theoryModules.length + 1}</h2>
                <p class="course-lead">Apply what you learned with hands-on coding tasks.</p>
                <h3>Practice Prompt</h3>
                <p>Open the coding environment and solve the linked problem for this lab.</p>
              </section>`;
          const mod = await Module.create({
            title,
            slug: `${level.slug}-module-${i + 1}`,
            level: level._id,
            order: i,
            type: isTheory ? 'theory' : 'practice',
            content,
            videoUrl: '',
          });
          createdModules.push(mod);
        }
        modules = createdModules;
        await Level.findByIdAndUpdate(level._id, { $push: { modules: { $each: createdModules.map((m) => m._id) } } });
        console.log(`Created ${createdModules.length} modules for ${course.name} - ${levelName}`);
      }

      // Apply theory/program distribution:
      // Beginner: 7 theory, 3 practice
      // Intermediate: 5 theory, 5 practice
      // Expert: 3 theory, 7 practice
      let theoryCount = 7;
      if (levelSlug === 'intermediate') theoryCount = 5;
      if (levelSlug === 'expert') theoryCount = 3;

      modules = await Module.find({ level: level._id }).sort({ order: 1 });
      for (let i = 0; i < modules.length; i++) {
        const type = i < theoryCount ? 'theory' : 'practice';
        if (modules[i].type !== type) {
          modules[i].type = type;
          await modules[i].save();
        }
      }

      // Refresh theory content/titles from the latest syllabus
      const theoryDefs = getTheoryModules(slug, levelSlug);
      modules = await Module.find({ level: level._id }).sort({ order: 1 });
      for (let i = 0; i < modules.length; i++) {
        const isTheory = i < theoryDefs.length;
        if (isTheory) {
          const def = theoryDefs[i];
          const nextTitle = `${course.name} ${levelName} · ${def.title}`;
          const nextContent = renderTheoryHtml(def, slug, levelName);
          if (modules[i].title !== nextTitle || modules[i].content !== nextContent) {
            modules[i].title = nextTitle;
            modules[i].content = nextContent;
            modules[i].type = 'theory';
            await modules[i].save();
          }
        } else if (modules[i].type === 'practice' && !modules[i].title.includes('Practice Lab')) {
          modules[i].title = `${course.name} ${levelName} · Practice Lab ${i - theoryDefs.length + 1}`;
          if (!modules[i].content) {
            modules[i].content = `<section class="course-section">
              <h2>${course.name} ${levelName} · Practice Lab ${i - theoryDefs.length + 1}</h2>
              <p class="course-lead">Apply what you learned with hands-on coding tasks.</p>
              <h3>Practice Prompt</h3>
              <p>Open the coding environment and solve the linked problem for this lab.</p>
            </section>`;
          }
          await modules[i].save();
        }
      }

      // Create/update final assessment quiz per level (10 MCQs per level)
      // Uses language-specific questions: Basic (7 Theory + 3 Program), Intermediate (5+5), Expert (3+7)
      const courseQuestions = FINAL_QUESTIONS[course.slug];
      const finalQuestions = courseQuestions?.[levelSlug] || [
        { question: `(${levelName}) Concepts of variables and data types?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Control flow: if/else?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Loops and iteration?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Functions and parameters?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Arrays / lists?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Objects / dictionaries?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Basic debugging and errors?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Problem-solving patterns?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Time complexity intuition?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
        { question: `(${levelName}) Reading and understanding code?`, options: ['Very comfortable', 'Comfortable', 'Somewhat comfortable', 'Not comfortable'], correctIndex: 1, marks: 1 },
      ];
      let finalQuiz = await Quiz.findOne({ type: 'final', level: level._id });

      if (!finalQuiz) {
        finalQuiz = await Quiz.create({
          title: `${course.name} ${levelName} Final Assessment`,
          type: 'final',
          level: level._id,
          questions: finalQuestions,
          passingScore: 60,
        });
        await Level.findByIdAndUpdate(level._id, { finalAssessment: finalQuiz._id });
        console.log(`Final assessment created for ${course.name} - ${levelName}`);
      } else {
        await Quiz.findByIdAndUpdate(finalQuiz._id, { questions: finalQuestions });
        console.log(`Final assessment updated for ${course.name} - ${levelName}`);
      }

      // Seed at least one coding problem for every practice module in this level
      const practiceModules = await Module.find({ level: level._id, type: 'practice' }).sort({ order: 1 });
      for (const [idx, mod] of practiceModules.entries()) {
        const existingProblems = await CodingProblem.countDocuments({ module: mod._id });
        if (existingProblems === 0) {
          const problem = await CodingProblem.create({
            title: `${course.name} ${levelName} - Practice ${idx + 1}`,
            description: `Write a simple program related to the concepts in ${mod.title}.`,
            difficulty: 'easy',
            constraints: '',
            starterCode: '',
            testCases: [
              { input: '\n', expectedOutput: 'Hello, World!\n', isSample: true },
            ],
            category: 'practice',
            module: mod._id,
            level: level._id,
            order: idx,
          });
          await Module.findByIdAndUpdate(mod._id, { $addToSet: { codingProblems: problem._id } });
          console.log(`Coding problem created for ${course.name} - ${levelName} - ${mod.title}`);
        }
      }
    }
  }

  let placementQuiz = await Quiz.findOne({ type: 'placement' });
  if (!placementQuiz) {
    const questions = [
      { question: 'What is a variable?', options: ['A container for data', 'A function', 'A loop', 'A keyword'], correctIndex: 0, marks: 1 },
      { question: 'Which keyword defines a function in Python?', options: ['func', 'def', 'function', 'fn'], correctIndex: 1, marks: 1 },
      { question: 'What does == compare?', options: ['Identity', 'Value', 'Type', 'Memory'], correctIndex: 1, marks: 1 },
      { question: 'What is a loop used for?', options: ['Declaring variables', 'Repeating code', 'Importing modules', 'Defining classes'], correctIndex: 1, marks: 1 },
      { question: 'What is an array/list index?', options: ['A type', 'Position of an element', 'A function', 'A loop'], correctIndex: 1, marks: 1 },
      { question: 'What does "return" do?', options: ['Exits the program', 'Sends a value back from a function', 'Prints output', 'Starts a loop'], correctIndex: 1, marks: 1 },
      { question: 'What is OOP?', options: ['A language', 'Object-Oriented Programming', 'A compiler', 'A loop'], correctIndex: 1, marks: 1 },
      { question: 'What is recursion?', options: ['A data type', 'A function calling itself', 'A variable', 'A keyword'], correctIndex: 1, marks: 1 },
      { question: 'What is time complexity?', options: ['Speed of code', 'Growth of runtime with input size', 'Memory usage', 'Code length'], correctIndex: 1, marks: 1 },
      { question: 'What is a data structure?', options: ['A loop', 'A way to organize and store data', 'A function', 'A variable'], correctIndex: 1, marks: 1 },
    ];
    placementQuiz = await Quiz.create({
      title: 'Placement Assessment',
      type: 'placement',
      questions,
      passingScore: 40,
    });
    console.log('Placement quiz created (10 questions)');
  }

  console.log('Seed completed.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
