
import { xxh32 } from "xxh32";

import { Tokens } from "./Token.ts";


//

export class Line {
	readonly hash: number;
	tokens: Tokens | undefined;

	constructor(
		public readonly nr: number,
		public readonly level: number,
		public readonly code: string
	) {
		this.hash = xxh32(code);
	}
}
