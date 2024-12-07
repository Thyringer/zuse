
//

export const Tab = 0;

export type indentation = 0 | 2 | 3 | 4 | 5 | 6 | 7 | 8


//

export class Presets {
	constructor(
		public readonly indent: indentation = Tab,
		public readonly unsecured: boolean = false,
		//public readonly colors: ColorScheme
	) {}
}


/*
export class ColorScheme {

	constructor(
		public readonly string: A,
		public readonly error: RGB
	) {}
}


const DefaultColorScheme = new ColorScheme(

)
*/


//

export enum CompilationState {
	Preparing,
	Prelexed,
	Lexed,
	Parsed,
	Resolved,
	Analyzed,
	Optimized,
	Emitted
}
