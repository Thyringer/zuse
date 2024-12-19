


//

export class ID extends Array<string> {

	display: string;

	constructor(...items: string[]) {
		super(...items);

		this.display = this.join(".");
	}
}


//

enum DeclarationType {
	Component,
	Value,
	Type,
	Concept
}



export class Declaration {

	static Type = class {

		constructor(

		) {}
	}


	constructor(
		public readonly line_from: number,
		public readonly line_to: number,
		public readonly first_token: number,
		public readonly last_token: number,

	) {
		
	}
}
