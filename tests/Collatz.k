component -Col-la+++tz----

collatz : i -> i where Integer i

## Repeatedly divides an even number by 2 and multiplies an odd number by 3 and adds 1, until it reaches 1.
	## etc…
collatz n = if
	n == 1 then   1
	even? n then collatz (n / 2.0)
	else collatz (((3 * n) + 1) / 2)
with	
	even? = \n -> n &mod 2 == 0


a = floor 1234.56789
x = collatz << a # Just a function call.
y = collatz(0x1085.23456789(65432))

# program : *IO -> *IO
program = echo << "result for \"collatz {a}\"" <> String::a <> 'x''ykx'

z = collatz Int:::x'1234567890AB'///
