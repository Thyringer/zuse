
component Shape provides
	Shape::*,
	Shape as S,
	section Math,
	app

use Base unqualified

use Hash as H

use ..XYZ


type Shape has
	Circle -radius Int
	EquilateralTriangle Int | Triangle -a Int -b Int -angle Int
	Square Int | Rectangle: Int Int -> Shape


section Math has
	add = function a b -> a + b
	pi = 3.14159265359


program : *IO -> *IO
program = do
	r := 1.3
	write "area: "
	write << r**2 * Math.pi


# Ein Türke türkt trügerisch türkische Türkenware.

app = do
	write << Stdout "Pls enter your name: "
		# or: write (Stdout "Pls enter your name: ")
	read Stdin::Line
	write Stdout ("\nHello " <> buf)

# 這是一篇文言註釋
