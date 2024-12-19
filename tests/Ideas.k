component Ideas


type Error is -phase Phase, -issue Nat 99, -ids Array String ~ {}

subtype CodeError of Error is .., -line Nat 9999, -column-from Nat, -column-to Nat, -ids


type Weekend has Sunday | Saturday

supertype Weekday of Weekend has
	Monday | Tuesday | Wednesday | Thursday | Friday

