
import { CompileError, ErrorLocation, Phase, ProjectError } from "../CompileError.ts";

import { indentation, Tab } from "../Presets.ts";

import { Line } from "./Line.ts";
import { Unit } from "./Unit.ts";


//

export type LinearizedUnit = Unit;


export function linearize(
	source_code: string,
	component_id: Array<string>,
	indent: indentation
): LinearizedUnit {
	const unit = new Unit(component_id);

	let index = 0;

	let line_nr = 1;
	let line_beginning = 0;
	let level = 0;
	let offset = 0;

	let code_line: string;	

	/*
	const logError = (issue: number, from: number = 0, to: number = 0) => unit.errors.push(
		new CompileError(Phase.Parsing, issue, [new ErrorLocation(line_nr, from, to)]));
	*/

	const pushLine = () => {
		code_line = source_code.slice(line_beginning + offset, index).trimEnd();
		if (code_line) {
			unit.lines.set(line_nr, new Line(level, code_line));
		}
	};


	const advanceToLineEnd = () => {
		while (index < source_code.length && source_code[index] !== "\n") {
			index += 1;
		}
	};


	const determineIndent = () => {
		line_nr += 1;
		line_beginning = index + 1;
		level = 0;
		offset = 0;

		if (indent === Tab) {
			while (source_code[line_beginning + offset] === "\t") {
				level++;
				offset++;
			}
		}
		else {
			while (source_code[line_beginning + offset] === " ") {
				offset++;
			}
			level = Math.floor(offset / indent);
		}

		index += offset;
	};


	for (index; index < source_code.length; index++) {
		if (source_code[index] === "\n") {
			pushLine();
			determineIndent();
		}
		else if (source_code[index] === "#") {
			if (source_code[index + 1] === "#" && (index === line_beginning + offset ||
			    index === line_beginning + offset + (level * indent))
			) {		
				advanceToLineEnd();
				pushLine();
				determineIndent();
			}
			else {
				pushLine();
				advanceToLineEnd();
				determineIndent();
			}
		}
	}

	pushLine();	

	return unit;
}

