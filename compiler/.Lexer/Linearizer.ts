
import { indentation, Tab } from "../Presets.ts";

import { Line } from "./Line.ts";
import { LinearizedCode } from "./LinearizedCode.ts";


//

export function linearize(
	source_code: string,
	component_name: string[],
	indent: indentation
): LinearizedCode {
	const lines = new LinearizedCode(component_name);

	let index = 0;

	let line_number = 1;
	let line_beginning = 0;
	let level = 0;
	let offset = 0;

	let line_code: string;	
	

	function pushLine() {
		line_code = source_code.slice(line_beginning + offset, index).trimEnd();
		if (line_code) lines.push(new Line(line_number, level, line_code));
	}


	function advanceToLineEnd() {
		while (index < source_code.length && source_code[index] !== "\n") {
			index += 1;
		}
	}


	function determineIndent() {
		line_number += 1;
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
	}


	for (index; index < source_code.length; index++) {
		if (source_code[index] === "\n") {
			pushLine();
			determineIndent();
		}
		else if (source_code[index] === "#") {
			if (source_code[index + 1] === "#" && (
				index === line_beginning + offset ||
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

	return lines;
}


//

/*
Deno.test("Linearizer", async () => {
	const config = new Presets(4);
	const file_path = "./tests/BuggyCollatz.k";
	const source_code = await Deno.readTextFile(file_path);
	
	let start;
	let end;

	console.log("Measuring performance...");
	start = performance.now();
	const lines = await linearize(source_code, 4);
	if (lines instanceof Lines) {
		end = performance.now();
	
		console.log(`\n${lines.__pretokenize().displayTokens(85)}\n`);
		console.log(`function: ${end - start}ms`);
	}

	//console.log(lines.display());	
});
*/