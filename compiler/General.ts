
//

export function require(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}


/** Always excludes `undefined` and should thus only be used if the program logic actually requires this condition. */
export function defined<T>(value: T | undefined): T {
	if (value !== undefined) {
		return value;
	}
	else {
		throw new Error(`value is undefined`);
	}
}


export function nonempty<T extends { length: number }>(value: T): T {
	if (value.length > 0) {
		return value;
	}
	else {
		throw new Error(`value '${value}' is empty`);
	}
}


//

const Kind = Symbol('kind')


export type integer = number & { readonly [Kind]: 'integer' };

export function Integer(value: number): integer {
	return Number.isInteger(value) ? (value as integer) : NaN as integer;
}


/** Guarantees an integer number both statically and at runtime. */
export function requireInteger(value: number): number {
	if (Number.isInteger(value)) {
		return value;
	}
	else {
		throw new Error(`value '${value}' is not a whole number`);
	}
}


export type positive<T extends number> = T & { readonly [Kind]: "positive" };

export function Positive<T extends number>(value: T): positive<T> {
	return value > 0 ? (value as positive<T>) : NaN as positive<T>;
}


/** Guarantees a positive integer number both statically and at runtime. */
export function requirePositiveInteger(value: number): number {
	if (Number.isInteger(value) && value > 0) {
		return value;
	}
	else {
		throw new Error(`value '${value}' is not a positive whole number`);
	}
}


export type natural = number & { readonly [Kind]: 'natural' };

export function Natural(value: number): natural {
	return Number.isInteger(value) && value >= 0 ? (value as natural) : (NaN as natural);
}


/** Guarantees a natural number both statically and at runtime. */
export function requireNatural(value: number): number {
	if (Number.isInteger(value) && value >= 0) {
		return value;
	}
	else {
		throw new Error(`value '${value}' is not a natural number`);
	}
}


/**
 * Creates a Between<Min, Max> branded type if the value is within the specified range.
 * @param value - The number to check.
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns The branded Between<Min, Max> type if valid, otherwise throws an error.
 */
export function between<T, Min extends T, Max extends T>(value: T, min: Min, max: Max): T {
	if (value >= min && value <= max) {
		return value
	}
	else {
		throw new Error(`value '${value}' is not between '${min}' and '${max}'`);
	}
}


export type char = string & { readonly [Kind]: 'char' };

/** Guarantees a single character. If the input string has more characters, only the first one is returned. Empty strings result in an error. */
export function requireChar(value: string): string {
	if (value.length >= 1) {
		return value[0];
	}
	else {
		throw new Error(`character is missing (empty string)`);
	}
}


/**
 * Replaces all occurrences of `wildcard` in `text` with corresponding values from `values`.
 * @param {string} wildcard - Placeholder to replace in `text` (e.g., "{}").
 * @param {string} text - The string in which to replace wildcard occurrences.
 * @param {...string} values - Values to sequentially replace each wildcard.
 * @returns {string} New string with insertions, provided enough values ​​were provided for each placeholder.
 */
export function substitute(wildcard: string, text: string, ...values: Array<string>) {
	let index = 0;
	return text.replace(new RegExp(wildcard, 'g'), () => index < values.length ? values[index++] : wildcard);
}


Deno.test({
	name: "General",
	permissions: { read: true },
	fn: () => {
		/*
		const x = between(12.5 as integer, Integer(1), Integer(13));
		const y = between(Integer(10), 1 as integer, 10.5 as integer);

		const a: positive<integer> = Positive(Integer(1));

		console.log(x);
		console.log(y);
		console.log(a);
		*/
	},
});
