
import { CompileError } from "../CompileError.ts";


//

export class Project {
	errors: CompileError[];

	constructor() {
		this.errors = [];
	}
}
