component Collatz

collatz : i -> i where Integer i

## Repeatedly divides an even number by 2 and multiplies an odd number by 3 and adds 1, until it reaches 1.
	## etc…
collatz n = if
	n == 1 then   1
	even? n then collatz (n / 2)
	else collatz (((3 * n) + 1) / 2)
with	
	even? = \n -> n &mod 2 == 0


x = collatz 123456789 # Just a function call.
y = collatz(0x123456789)
z = collatz Int::x'1234567890AB'


# program : *IO -> *IO
program = echo x