
import { xxh32 } from "xxh32";

import { Tokens } from "./Token.ts";


//

export class Line {
	readonly hash: number;

	constructor(
		public readonly level: number,
		public readonly code: string,
		public tokens: Tokens = []
	) {
		this.hash = xxh32(code);
	}
}
