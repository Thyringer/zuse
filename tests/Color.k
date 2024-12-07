
component Color


type Hue is Int 0 360

nonmetric [%] of 1

type Pct is Quantity (Nat 100) %

type RGB is -r/red, -g/green, -b/blue Nat1

type RGBA is RGB, -a/alpha Nat1

type HSV is -h/hue Hue, -s/saturation, -v/value Nat 100

type HSL is -h/hue Hue, -s/saturation, -l/lightness Pct

type CMY is -c/cyan, -m/magenta, -y/yellow Pct

type CMYK is CMY, -k/key Pct
