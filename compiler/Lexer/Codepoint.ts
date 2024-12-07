
import { requireChar } from "../General.ts";


//

export enum CharType {
	Sign,
	Digit,
	CapitalLetter,
	SmallLetter,
	Tab,
	Other
}


//

export class Codepoint {

	value: number;

	/** Creates a valid UTF-16 code from the first character of the string. An empty string results in the code 0x00 (null terminator) to indicate that there is no meaningful value. */
	constructor(char: string = "") {
		this.value = char.length === 0 ? 0x00 : char.codePointAt(0)!;
	}


	isLetter(): boolean {
		return (
			(this.value >= 0x0041 && this.value <= 0x005A) // 'A' … 'Z'
			|| (this.value >= 0x0061 && this.value <= 0x007A) // 'a' … 'z'
			|| (this.value >= 0x00C0 && this.value <= 0x00D6) // Latin Supplement
			|| (this.value >= 0x00D8 && this.value <= 0x00DE)
			|| (this.value >= 0x00DF && this.value <= 0x00FF) // Latin Extended
			|| (this.value >= 0x0100 && this.value <= 0x017F)  
			|| (this.value == 0x017F)
			|| (this.value >= 0x1E00 && this.value <= 0x1EFF) // Latin Extended Additional
			|| (this.value >= 0x0370 && this.value <= 0x03A1) // Greek
			|| (this.value >= 0x03A3 && this.value <= 0x03A9)
			|| (this.value >= 0x03B1 && this.value <= 0x03C9) 
			|| (this.value >= 0x0400 && this.value <= 0x04FF) // Cyrillic
			|| (this.value >= 0x0500 && this.value <= 0x052F) 
			|| (this.value >= 0x2DE0 && this.value <= 0x2DFF) // Cyrillic Extended
		);
	}

	// Method to check if the UTF-16 this.value is an uppercase letter
	isCapitalLetter(): boolean {
		return (
			(this.value >= 0x0041 && this.value <= 0x005A)                  // Latin Basic
			|| (this.value >= 0x00C0 && this.value <= 0x00D6)                  // Latin Supplement
			|| (this.value >= 0x00D8 && this.value <= 0x00DE)
			|| (this.value >= 0x0100 && this.value <= 0x0176 && this.value % 2 == 0) // Latin Extended
			|| (this.value >= 0x01F8 && this.value <= 0x021E && this.value % 2 == 0)
			|| (this.value >= 0x0220 && this.value <= 0x0232 && this.value % 2 == 0)
			|| (this.value >= 0x1E00 && this.value <= 0x1EF8 && this.value % 2 == 0) // Latin Additional
			|| (this.value >= 0x0391 && this.value <= 0x03A1)                  // Greek Basic
			|| (this.value >= 0x03A3 && this.value <= 0x03A9)
			|| (this.value >= 0x0410 && this.value <= 0x042F)                  // Cyrillic Basic
			|| (this.value >= 0x0460 && this.value <= 0x04C0 && this.value % 2 == 0) // Cyrillic Extended
		); 
	}

	// Method to check if the UTF-16 this.value is a lowercase letter
	isSmallLetter(): boolean {
		return (
			(this.value >= 0x0061 && this.value <= 0x007A)                  // Latin Basic
			|| (this.value >= 0x00DF && this.value <= 0x00F6)                  // Latin Supplement
			|| (this.value >= 0x00F8 && this.value <= 0x00FF)
			|| (this.value >= 0x0101 && this.value <= 0x0177 && this.value % 2 == 1) // Latin Extended
			|| (this.value == 0x0178)
			|| (this.value >= 0x017A && this.value <= 0x021F && this.value % 2 == 1)
			|| (this.value >= 0x0223 && this.value <= 0x0233 && this.value % 2 == 1)
			|| (this.value == 0x023F)
			|| (this.value >= 0x1E01 && this.value <= 0x1EF9 && this.value % 2 == 1) // Latin Additional
			|| (this.value >= 0x03B1 && this.value <= 0x03C9)                  // Greek Basic
			|| (this.value >= 0x0430 && this.value <= 0x044F)                  // Cyrillic Basic
			|| (this.value >= 0x0461 && this.value <= 0x04C1 && this.value % 2 == 1)
		);
	}


	isDigit(): boolean {
		return (this.value >= 0x0030 && this.value <= 0x0039);
	}


	isBinDigit(): boolean {
		return (this.value === 0x0030 || this.value === 0x0031);
	}


	isHexDigit(): boolean {
		return (
			(this.value >= 0x0030 && this.value <= 0x0039) // '0' to '9'
			|| (this.value >= 0x0061 && this.value <= 0x0066) // 'a' to 'f'
			|| (this.value >= 0x0041 && this.value <= 0x0046) // 'A' to 'F'
		);
	}


	isBinPrefix(): boolean {
		return this.value === 0x0042 || this.value === 0x0062;
	}


	isHexPrefix(): boolean {
		return this.value === 0x0058 || this.value === 0x0078;
	}


	isPunctuation(): boolean {
		return (
			(this.value >= 0x0021 && this.value <= 0x002F) // '!' to '/'
			|| (this.value >= 0x003A && this.value <= 0x0040) // ':' to '@'
			|| (this.value >= 0x005B && this.value <= 0x005F) // '[' to '_'
			|| (this.value >= 0x007B && this.value <= 0x007E) // '{' to '~'
			|| (this.value === 0xC2B0)                       // '°' (degree sign));
		);
	}


	/** Checks for plus and minus signs. */
	isSign(): boolean {
		return this.value == 0x002B || this.value == 0x002D
	}


	isWordCharacter(): boolean {
		return this.isLetter() || this.isDigit() || this.isSign();
	}


	//
	presort(): CharType {
		if (this.isSign()) {
			return CharType.Sign;
		}
		else if (this.isDigit()) {
			return CharType.Digit;
		}
		if (this.isCapitalLetter()) {
			return CharType.CapitalLetter;
		}
		else if (this.isSmallLetter()) {
			return CharType.SmallLetter;
		}
		else if (this.value === 0x0009) {
			return CharType.Tab;
		}
		else {
			return CharType.Other;
		}
	}

}