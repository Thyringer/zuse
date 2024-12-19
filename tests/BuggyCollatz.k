compo		nent Collatz # name resolution error because componente is not named the same as its file

    ## Repeatedly divides an even number by 2 and multiplies an odd #number by 3 and adds 1, until it reaches 1.
    ## Crazy shit!
		collatz+ : i -> *i where Integer i##### type error because uniqueness is unjustified
	
collatz+ n = if
        n == 1 then   1
    even? n then collatz+ (n / 2)
    else col	latz+ (((3 * n) + 1) / 2)   ##   This is useless documentation.
    	with	   ##   This is useless documentation.
    even? = \n ->>   ##   This is useless documentation.
    		Num.Nat::(n &mod 2 == 0) # type error because specification expects a generic implementation
    		##   This is useless documentation.
x = --collatz b"123456789" # invalid literal for several reasons
y = C'1234567890ABCDEF'
	:: <bla>
	program = x # type error because program is of type `*IO -> *IO` and not `i where Integer ...`

