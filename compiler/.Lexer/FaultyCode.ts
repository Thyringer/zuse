
import { CompileErrors } from "../CompileError.ts";

import { LinearizedCode } from "./LinearizedCode.ts";


//

export class FaultyCode extends LinearizedCode {

	constructor(code: LinearizedCode, public readonly errors: CompileErrors) {
		super(code.component_name);
		this.push(...code);
	}


	get display(): string {
		return this.errors.map(err => err.display()).join('\n\n');
	}
}
