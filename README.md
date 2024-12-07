<div align="center">
    <img src="assets/Kalkyl.svg" alt="Logo Kalkyl programming language" width="600">
</div>

# Zuse Compiler for Kalkyl

Zuse ist the Compiler for the functional programming language Kalkyl.

In the long term, Zuse is to combine the following components:

- AOT compiler, which translates Kalkyl code into C and then uses a C compiler to further convert it into an application or lib
- project and package manager
- language server

## Compiling Zuse

Install Deno on your system and build the executable from the root directory of the project with the following command:

```bash
deno compile --output ./builds/zuse ./compiler/Main.ts
```

## Kalkyl Briefly

Kalkyl is a compiled programming language without garbage collection that aims to summarize developments and findings in the field of functional programming in a modern language for everyday software development, with the goal of using the simplest possible syntax to convey these features in an understandable way. In summary, Kalkyl strives

- to be as systematic as possible, both in terms of syntax and consistency in the features, by combining the simplicity of Python with the power of Haskell;
- to be pragmatic instead of dogmatically patronizing the programmer, which is why – although purely functional – the programer can still program in the usual imperative way with a syntax similar to Pascal but without its block verbosity;
- to offer a few general language features that can be easily combined with each other thanks to the totally expression-oriented structure, instead of many special individual solutions with poor orthogonality;
- to offer a dead simple project management, which is easy to understand for the programmer as well as easily processable by the compiler.

The main focus of Kalkyl's designs lies in referential transparency with only total functions, in order to not only promote the development of programs with as few as possible bugs, but also to exclude errors as far as possible through the language itself. To achieve this design goal, Kalkyl is based on

- a declarative stateless language structure together with uniqueness and linear types to maintain referential transparency;
- refinement types as the only means of avoiding unwanted arguments in order to enforce total functions instead of triggering errors.

These two cornerstones also make it much easier to manage dynamic memory safely without garbage collection, for which Kalkyl uses substructural logic in combination with smart pointers.

### Feature Overview

- higher, partially applicable, total functions
- uniqueness types instead of moands for stateful programming without loss of referential transparency
- extremely flexible generalized algebraic data types with type constructors that can depend on values
- multiparametric type classes with functional dependencies and a flexible module system to exchange implementations
- refinements to specify interfaces precisely, whose compliance can be ensured by the compiler
- modern dynamic memory management, which allows Kalkyl to be used almost like a scripting language, but without having to sacrifice high performance
- imperative language constructs that are embedded as expressions and can thus be seamlessly integrated with the rest of the language

### About the Name

The name "Kalkyl" – pronounced as [kalˈkyːl] – comes from the first high-level programming language, the "Plankalkül", which Konrad Zuse designed based on the lambda calculus with all the typical features that we know and expect from programming languages ​​today, making him decades ahead of his time.

The "y" in the name is just an international transcription for the German ü sound and an allusion to Python. In addition, projects in Kalkyl are called "plans", similar to how Zuse spoke of "Rechenplänen" [calculation plans] for programs. It is therefore not surprising that Kalkyl's compiler is named after Zuse.

## Explanations with Code Examples

This section provides a quick overview of Kalkyl's concepts and appearance. A detailed description of Kalkyl can be found in the `docs/` folder. However, this "Language Report" is not intended as a tutorial, but rather as a light version of a specification.

### Program Structure

Each Kalkyl program is composed of one or more components, which are reflected at directory level as source files and can also be called translation units:

```nim
component Geometry provides
    area,
    Shape::Circle,
    Shape::Rectangle,
    Shape
        # A type constructor can be listed separately, but gets automatically exported as soon as one of its value constructors is also publicly accessible.

# Or simplified, if all data constructors should be public anyway:
component Geometry provides Shape::*, area

use Base.Math unqualified
# Or import only `pi` unqualified and the rest through the namespace `Math`:
use Base.Math with pi

type Shape has Circle Float64 | Rectangle Float64 Float64

area (Circle r) = pi * r**2
area (Rectangle a b) = a * b 
```



The definition `program` of the main component forms the entry point:

```nim
program = do
    echo "Hello, what’s your name?"
    name <- get
    echo ("Nice to meet you " <> name <> ".")
```

Unlike Haskell, there is no syntax sugar to make monadic connections appear imperative, since there is simply no need for monads to handle input/output thanks to uniqueness types:

```nim
echo : String *IO -> *IO
get  : *IO -> String *IO
(<>) : a b -> c where Concating a b
(<-) : (Var t) (x -> t x) -> (x -> x)
(>>) : (a -> b) (b -> c) -> (a -> c)
```

Where `do` is also just a function that accepts any number of arguments and links them together with `>>`.

### Smart Constructors and Declared Tuples

Refinements allow you to specify smart data constructors:

```nim
type Even has Even {i : Int | i &mod 2 = 0} deriving coercion

x = Even 6
```

If only one data constructor is required, which should be named the same as the type constructor, this can be declared even more concisely:

```nim
type Even is {i : Int | i &mod 2 = 0}
```

In fact, all data constructors, unless defined manually, return their parameters as tuples:

```nim
rec = Rectangle 12.3 45.6
a = rec.1 # a → 45.6
```

Furthermore, data constructors are possible that describe tuples with field names (record):

```nim
type MailingAddress t has MailingAddress
    -str String
    -city String
    -zipcode String
    -country CountryCode

a = MailingAddress "123 Main St" "Springfield" "12345" US
# or with some labeled arguments:
b = MailingAddress "Max-Mustermann-Ring 12b" -country DE -zipcode "0123" -city "Leipzig"
```

If arguments are specified by name, the order does not matter.

The data constructor returns a tuple whose elements can then be accessed after construction. In addition, Kalkyl is also extremely flexible when it comes to applying functions; all arguments can be passed individually (curried), as a whole in the form of a tuple, or mixed between both variants:

```nim
i = ("123 Main St", "Springfield", "12345")
a = MailingAddress i US
```

The passed tuple is automatically disassembled to serve the individual parameters according to the specified order or labels.


### Fancy Naming

It should be emphasized that identifiers in Kalkyl can also contain hyphens and even plus signs `+`:

```Nim
type FileMode has
    Read/R | Read-Write/R+ | Rewrite/W | Read-Rewrite/W+ | Append/A | Read-Append/A+

File : FileMode -> Type
overwrite-file : (*File W+) String -> (*File W+) 
```

The slash `/` simply separates an alternative shorter name, which is preferred at type level, from the first variant.

Lowercase names that begin with a hyphen will be treated as "labels" that can be used to name types and values, as already shown in the previous examples. The hyphen was chosen to avoid an inflated use of `:` or `=` and to enable neat syntax, which is a bit reminiscent of CLI program parameters.

This of course has the consequence that spaces are ALWAYS required between the binary operators `+` and `-`, which, however, can hardly be seen as a disadvantage, but rather as imposed proper code style. The only real disadvantage is the impossibility of using the minus sign as a unary prefix operator, but let's be honest: how often do you need that? Here, a negation function can serve the same purpose, or the following idiom: `-1*x`, which is possible since `*` and `/` are among the few punctuation characters that do not necessarily require whitespace for their operands.


### Modularity despite Ad hoc Polymorphism

For systematic overloading, Kalkyl offers type classes like in Haskell, which are called concepts, to avoid confusion with classes from OOP languages ​​and to emphasize the basic idea of ​​designing (conceptualizing) interfaces:

```nim
concept Displayable a has
    display : a -> String

preinstall module Displayable Bool has
    display True = "true"
    display False = "false"
```

Implementations of a concept can be globally unique and coherent, as in Haskell, which is called "pre-installing" in Kalkyl, enabling the compiler to automatically find the appropriate instance.

As long as no concrete implementation is required, concepts appear as constraints that impose conditions on type variables to guarantee that a generic function works for their values:

```nim
display : a -> String where Displayable a
```

It may be necessary to replace a pre-installation with another installed module locally:

```nim
slang = module Displayable Bool has
    display True = "Yo"
    display False = "Nope"

x = display True using slang # x → "Yo"
```

Implementations of concepts are first-class citizens in Kalkyl, so they can be defined like ordinary values ​​and processed by functions but also installed with `using` for a specific definition or with "install" for an entire component. Alternatively, a module is directly usable without prior installation:

```nim
x = slang.display True
```

This flexible interchangeability is ultimately the reason why implementations of concepts are called modules.

Components themselves can be specified by a concept as well, but this only serves the purpose of defining plugins for an existing application:

```nim
component KalkylSyntax : ExampleTextEditor.SyntaxHighlighting

use ExampleTextEditor
```

### High-performance Data Structures in Kalkyl itself

Tuples form the basis for defining more complex data structures:

```nim
type Node t is (-data t, -next ^Node ~ Null)
    # The tilde is a type operator to assign a value ​​as default to a type: (~) : {t : Type} t -> {t}.

extend : (^Node t) t -> Sub (^Node t)
extend node data = do
    if node /= Null then
        # Copy memory address from `node` to `current` and borrow all rights until `node` is reused:
        current <= node
        while current^.next /= Null loop current := current^.next
        current^.next := init (Node data)
        last := current^.next
        # Once `node` is used, `current` is no longer available as it may still be the original pointer:
        Subpointer node last
    else
        Subpointer (init Node data) Null
```

The type constructor `Sub` simply represents a tuple, where the second pointer – the "subpointer" – is only accessible through the first pointer – the "main pointer". For reasons of simplicity, no direct distinction is made between these at the type level, but only semantically in the context, since main pointers reside exclusively on the stack and subpointers only exist as part of a dynamic data structure in the heap, which has certain consequences: subpointers behave in an affine manner in contrast to main pointers, which basically always have to be consumed or returned.

```nim
type Sub a b~a has Subpointer -main ^a -sub ^b # (Sub) : {t} Type~t -> Type
```

Kalkyl gives the programmer direct access to imperative language constructs to define the most efficient data structure, while the compiler can exclude memory errors from the ground up thanks to its advanced type system and clear rules. The remaining errors related to pointers that are undetectable at compile time get intercepted by smart pointers, which can nevertheless be optimized away for a specific compilation unit – also called components in Kalkyl. The idea is that for test versions and general applications where 100% performance is not crucial, errors get noticed and recorded at runtime.

### Simple Rules enable Efficiency despite Abstraction

In contrast to Rust, Kalkyl does not differentiate between "safe" and "unsafe", but basically only allows safe code, whose safety guarantees at runtime can be opted out using respective compilation settings, which is particularly appropriate for proven implementations.

Furthermore, pointers in Kalkyl serve the sole purpose of implementing data structures, but are not intended for everyday use. The programmer only sees ordinary (free) or unique types:

```nim
extend : (*Array t) t -> *Array t
```

Instead of requiring a pointer or mutable reference, the function expects - simply expressed by an asterisk - that an array must be passed that no one else references. The compiler can provide this guarantee through simple code analysis at compile time, so that the function is able to manipulate such an array safely without destroying the referential transparency of the code, since that passed array is ultimately not used anywhere else. Internally, of course, a pointer is dereferenced to update the header and data of the array; but to the user of the `extend` function, `Array t` appears as a value that just has to be unique.

### Functional Programming meets Memory Management

The function `init` allocates dynamic memory and returns a pointer to it:

```nim
init : t -> ^t where Allocating t, Runtime
```

The constraint `Runtime` ensures that the compiler does not consider this function to be statically applicable, but rather postpones the evaluation of such an expression as a whole to runtime. In this sense, `Runtime` can be thought of as an implicit parameter for an unique argument that gets automatically passed when the program starts, thus maintaining the referential transparency; since `Runtime` reflects the real fact at code level that the heap state is actually only known at runtime.

## Note on development and specification

The "Language Report" is not intended as a tutorial or textbook, but rather as a light version of a specification that is largely "finished". However, a few sections are still missing. The language report is also still subject to minor adjustments in general, so examples that refer to features already presented in previous chapters may still be accidentally unchanged.

For example, the lexical structure of Kalkyl was changed to be very easy to parse. Original ideas such as custom literals for paths and tags were discarded, as much more useful DSLs can be built using the curried functions in Kalkyl. For similar reasons, multi-line strings have been discarded, and instead the option of reading text files as strings at compile time is intended, which is much more flexible and at the same time keeps the program code clear. Furthermore, multi-line comments have also been discarded, as these are mostly only used to comment out code, for which Kalkyl now offers the keyword `ex` instead, which, when placed before declarations, causes the compiler to only check the syntax without resolving names or performing any static checks. All of these simplifications even led to Kalkyl's lexer being able to process each line independently of the others.

Similar further simplifications are to be expected in the future. However, the design of the language is 95% complete and has been thoroughly thought through; hence far-reaching syntax changes are quite unlikely, not least because no further features are planned. The first data types and concepts of the standard library have also already been fixed, with the wealth of experience from Haskell being used here in particular.
