
import { assertEquals, assertLess } from "@std/assert";

import { color } from "../TUI.ts"
import { Codepoint } from "./Codepoint.ts";


//

export class Token {
	category: LexicalCategory | undefined;
	lexeme: ReservedSymbol | string | null;

	/**
	 * Creates a token that identifies and categorizes a lexeme in a Kalkyl code line.
	 * @param category First rough categorization of the lexeme.
	 * @param lexeme Either null when whitespace, or substring. For a reserved symbol, the string gets discarded after the token name is determined.
	 * @param from Index that points to the beginning of the lexeme in the code string.
	 * @param to Index where the lexeme ends – at least `from + 1`.
	 */
	constructor(
		category: LexicalCategory | undefined,
		lexeme: string | null,
		public from: number,
		public to: number
	) {
		if (lexeme !== null) {
			if (lexeme in Keywords) {
				this.category = LexicalCategory.Keyword;
				this.lexeme = Keywords[lexeme];
				
			}
			else if (lexeme !== null && lexeme in Demarcators) {
				this.category = LexicalCategory.Demarcator;
				this.lexeme = PunctuationData[lexeme].name;
			}
			else if (lexeme !== null && lexeme in PunctuationData) {
				this.category = LexicalCategory.Punctuation;
				this.lexeme = PunctuationData[lexeme].name;
			}
			else {
				this.category = category;
				this.lexeme = lexeme;
			}
		}
		else {
			this.category = LexicalCategory.Whitespace;
			this.lexeme = null;
		}
	}


	get display_name(): string {
		if (this.category === undefined) {
			return "?";
		}
		else {
			return LexicalCategory[this.category];
		}
	}


	// deno-lint-ignore getter-return
	get display_lexeme(): string {
		if (this.category === undefined) {
			return color.String(this.lexeme);
		}
		else {
			switch (this.category) {
				case LexicalCategory.Whitespace: {
					return "null";
				}
				case LexicalCategory.Demarcator:
				case LexicalCategory.Punctuation: {
					const name = color.reserved_symbol(Punctuation[this.lexeme as Punctuation]);
					const lexeme = color.comment(PunctuationLexemes[this.lexeme as Punctuation])
					return `${name} ${lexeme}`;
				}

				case LexicalCategory.Keyword: {
					const name = color.reserved_symbol(Keyword[this.lexeme as Keyword]);
					const lexeme = color.comment(KeywordLexemes[this.lexeme as Keyword])
					return `${name} ${lexeme}`;
				}
				default: {
					return color.String(this.lexeme);
				}
			}
		}
	}


	/** Is it a lexeme with single or double quotation marks? */
	isQuoting(): boolean {
		return this.category === LexicalCategory.RawString
		    || this.category === LexicalCategory.String
	}


	isName(): boolean {
		return this.category === LexicalCategory.UncapitalizedName
		    || this.category === LexicalCategory.CapitalizedName
	}
}


export class Tokens extends Array<Token> {

	constructor(...items: Token[]) {
		super(...items);
	}
}


//

export enum LexicalCategory {
	Whitespace = 0,
	Demarcator,
		// Whitespace and separators are just special punctuations, whose distinction in advance facilitates parsing.
	Punctuation,
	Keyword,
	// NAME CASES
	UncapitalizedName,
	Label,
	Predicate,
	CapitalizedName,
	// NUMBER LITERALS
	Integer,
	BinaryInteger,
	HexadecimalInteger,
	//IntegerPart,
	//FractionalPart,
	//Repetend,
	// STRING LITERALS
	//Binary,
	//Hex,
	RawString,
	String,
	//
	Documentation
}


//

type ReservedSymbol = Keyword | Punctuation;

const FirstKeywordValue = 1;

export enum Keyword {
	// DECLARATIONS :: INTRODUCTORY SYMBOLS
	// Keywords that only appear in declaration constructs.
	Alias = 1,                        // alias
	Component,                         // component
	Concept,                           // concept
	Install,                           // install
	Metric,                            // metric
	Nonmetric,                         // nonmetric
	Preinstall,                        // preinstall
	Section,                           // section
	Subtype,                           // subtype
	Supertype,                         // supertype
	Type,                              // type
	Use,                               // use

	// DECLARATIONS :: SUPPLEMENTARY SYNTAX
	Adopts,                            // adopts
	As,                                // as
	Deriving,                          // deriving
	Ex,                                // ex
	Forall,                            // forall
	Given,                             // given
	Has,                               // has
	Is,                                // is
	Provides,                          // provides
	Under,                             // under
	Unqualified,                       // unqualified
	Where,                             // where
	With,                              // with

	// EXPRESSIONS
	// Keywords that only appear as part of special bindable constructs.
	Auto,                              // auto
	Break,                             // break
	Case,                              // case
	Continue,                          // continue
	Do,                                // do
	Else,                              // else
	For,                               // for
	If,                                // if
	In,                                // in
	Let,                               // let
	Loop,                              // loop
	Module,                            // module
	Of,                                // of
	Return,                            // return
	Then,                              // then
	Unless,                            // unless
	Using,                             // using
	While,                             // while

	// EXPRESSIONS :: VERBAL OPERATORS
	And,                               // and
	InQuery,                           // in?
	IsQuery,                           // is?
	Nand,                              // nand
	Nor,                               // nor
	Not,                               // not
	Or,                                // or
	Xnor,                              // xnor
	Xor                                // xor
}


const FirstPunctuationValue = 61;

export enum Punctuation {
	// PUNCTUATION :: DECLARER
	Specifier = 61,                    // :
	Definer,                           // =
	OmissionOrDefault,                 // ~

	// PUNCTUATION :: SEPARATING
	Lister,                            // ,
	End,                               // ;

	// PUNCTUATION :: GROUPING
	TupleBegin,                        // (
	TupleEnd,                          // )
	IndexBegin,                        // [
	IndexEnd,                          // ]
	SetBegin,                          // {
	SetEnd,                            // }

	// PUNCTUATION :: QUALIFIERS
	ValueCaller,                       // $
	MethodCaller,                      // &
	QualifierOrNumbering,              // .
	TypeHinter,                        // ::
	DereferOrPointer,                  // ^

	// PUNCTUATION :: PATTERN SYNTAX
	Arrow,                             // ->
	Ellipsis,                          // ..
	Function,                          // \
	Placeholder,                       // _
	VariantSeparator,                  // |

	// OPERATORS :: TYPES   
	Mutable,                           // !
	Optional,                          // ?

	// OPERATORS :: GENERAL 
	Adding,                            // +
	Reducing,                          // -
	Tolerating,                        // +-
	UniqueOrMultiplying,               // *
	Potentiating,                      // **
	Dividing,                          // /
	Extracting,                        // //

	// OPERATORS :: COMPARISON
	Equal,                             // ==
	Unequal,                           // /=
	Less,                              // <
	NotGreater,                        // />
	LessOrEqual,                       // =<
	Greater,                           // >
	NotLess,                           // /<
	GreaterOrEqual,                    // >=

	// OPERATORS :: DATA 
	Concating,                         // <>
	PairBuilder,                       // =>
	Crossing,                          // ><
	AttributingLeft,                   // <:
	AttributingRight,                  // :>
	Nesting,                           // </

	// OPERATORS :: SEQUENCING
	FlowLeft,                          // <<
	FlowRight,                         // >>
	TransmitLeft,                      // <*
	TransmitRight,                     // *>
	Parallel,                          // ||

	// OPERATORS :: ASSIGNMENT
	Binding,                           // <-
	Assignment,                        // :=
	Borrowing,                         // <=

	// OPERATORS :: MEMORY MANAGEMENT
	Address,                           // @

	// UNITS OF MEASUREMENT
	Percent,                           // %
}


//

/** Object used as a dictionary to map keywords to the corresponding integer values, so that one does not have to continue working with the much less efficient strings. Furthermore, for the sake of simplicity, no distinction is made between operators and keywords at the lexical level. */
export const Keywords: { [key: string]: Keyword } = {
	"alias": Keyword.Alias,
	"component": Keyword.Component,
	"concept": Keyword.Concept,
	"install": Keyword.Install,
	"metric": Keyword.Metric,
	"nonmetric": Keyword.Nonmetric,
	"preinstall": Keyword.Preinstall,
	"section": Keyword.Section,
	"subtype": Keyword.Subtype,
	"supertype": Keyword.Supertype,
	"type": Keyword.Type,
	"use": Keyword.Use,
	"adopts": Keyword.Adopts,
	"as": Keyword.As,
	"deriving": Keyword.Deriving,
	"ex": Keyword.Ex,
	"forall": Keyword.Forall,
	"given": Keyword.Given,
	"has": Keyword.Has,
	"is": Keyword.Is,
	"provides": Keyword.Provides,
	"under": Keyword.Under,
	"unqualified": Keyword.Unqualified,
	"where": Keyword.Where,
	"with": Keyword.With,
	"auto": Keyword.Auto,
	"break": Keyword.Break,
	"case": Keyword.Case,
	"continue": Keyword.Continue,
	"do": Keyword.Do,
	"else": Keyword.Else,
	"for": Keyword.For,
	"if": Keyword.If,
	"in": Keyword.In,
	"let": Keyword.Let,
	"loop": Keyword.Loop,
	"module": Keyword.Module,
	"of": Keyword.Of,
	"return": Keyword.Return,
	"then": Keyword.Then,
	"unless": Keyword.Unless,
	"using": Keyword.Using,
	"while": Keyword.While,
	"and": Keyword.And,
	"in?": Keyword.InQuery,
	"is?": Keyword.IsQuery,
	"nand": Keyword.Nand,
	"nor": Keyword.Nor,
	"not": Keyword.Not,
	"or": Keyword.Or,
	"xnor": Keyword.Xnor,
	"xor": Keyword.Xor
};

/*
function getKeyword(symbol: Keyword): string | null {
	for (const [key, val] of Object.entries(Keywords)) {
		if (val === symbol) {
			return key;
		}
	}
	return null;
}
*/

const KeywordLexemes: { [key in Keyword]: string } = Object.fromEntries(
    Object.entries(Keywords).map(([key, value]) => [value, key])
) as { [key in Keyword]: string };  // Type assertion to the correct mapped type


//

type PunctuationData = { name: Punctuation, unambiguous: boolean, demarcating: boolean }

/**
 * Bundles all relevant data to significantly simplify tokenization through automation based on the information provided here.
 * @param name Symbol to be identified.
 * @param unambiguous Is the symbol unique, or is it part of other – longer – punctuations?
 * @param demarcating Can the symbol be adjacent to other lexemes without any whitespace?
 * @returns 
 */
function pd(
	name: Punctuation,
	unambiguous: boolean,
	demarcating: boolean
): PunctuationData {
	return { name: name, unambiguous: unambiguous, demarcating: demarcating };
}

/** In Kalkyl, punctuation marks with more than two characters are deliberately avoided. Likewise, for the sake of simplicity, no distinction is made at the lexical level between operators and punctuations. */
export const PunctuationData: { [key: string]: PunctuationData } = {
	 ":": pd(Punctuation.Specifier, false, true),
	 "=": pd(Punctuation.Definer, false, false),
	 "~": pd(Punctuation.OmissionOrDefault, true, true),
	 ",": pd(Punctuation.Lister, true, true),
	 ";": pd(Punctuation.End, true, true),
	 "(": pd(Punctuation.TupleBegin, true, true),
	 ")": pd(Punctuation.TupleEnd, true, true),
	 "[": pd(Punctuation.IndexBegin, true, true),
	 "]": pd(Punctuation.IndexEnd, true, true),
	 "{": pd(Punctuation.SetBegin, true, true),
	 "}": pd(Punctuation.SetEnd, true, true),
	 "$": pd(Punctuation.ValueCaller, true, true),
	 "&": pd(Punctuation.MethodCaller, true, true),
	 ".": pd(Punctuation.QualifierOrNumbering, false, true),
	"::": pd(Punctuation.TypeHinter, true, true),
	 "^": pd(Punctuation.DereferOrPointer, true, true),
	"->": pd(Punctuation.Arrow, true, false),
	"..": pd(Punctuation.Ellipsis, true, true),
	"\\": pd(Punctuation.Function, true, true),
	 "_": pd(Punctuation.Placeholder, true, false),
	 "|": pd(Punctuation.VariantSeparator, false, false),
	 "!": pd(Punctuation.Mutable, true, true),
	 "?": pd(Punctuation.Optional, true, true),
	 "+": pd(Punctuation.Adding, false, false),
	 "-": pd(Punctuation.Reducing, false, false),
	"+-": pd(Punctuation.Tolerating, true, false),
	 "*": pd(Punctuation.UniqueOrMultiplying, false, true),
	"**": pd(Punctuation.Potentiating, true, true),
	 "/": pd(Punctuation.Dividing, false, true),
	"//": pd(Punctuation.Extracting, true, true),
	"==": pd(Punctuation.Equal, true, false),
	"/=": pd(Punctuation.Unequal, true, false),
	 "<": pd(Punctuation.Less, false, false),
	"/>": pd(Punctuation.NotGreater, true, false),
	"=<": pd(Punctuation.LessOrEqual, true, false),
	 ">": pd(Punctuation.Greater, false, false),
	"/<": pd(Punctuation.NotLess, true, false),
	">=": pd(Punctuation.GreaterOrEqual, true, false),
	"<>": pd(Punctuation.Concating, true, false),
	"=>": pd(Punctuation.PairBuilder, true, false),
	"><": pd(Punctuation.Crossing, true, false),
	"<:": pd(Punctuation.AttributingLeft, true, false),
	":>": pd(Punctuation.AttributingRight, true, false),
	"</": pd(Punctuation.Nesting, true, false),
	"<<": pd(Punctuation.FlowLeft, true, false),
	">>": pd(Punctuation.FlowRight, true, false),
	"<*": pd(Punctuation.TransmitLeft, true, false),
	"*>": pd(Punctuation.TransmitRight, true, false),
	"||": pd(Punctuation.Parallel, true, false),
	"<-": pd(Punctuation.Binding, true, false),
	":=": pd(Punctuation.Assignment, true, false),
	"<=": pd(Punctuation.Borrowing, true, false),
	 "@": pd(Punctuation.Address, true, true),
	 "%": pd(Punctuation.Percent, true, true)
};

/*
function getPunctuation(symbol: Punctuation): string | null {
	for (const [key, val] of Object.entries(PunctuationData)) {
		if (val.name === symbol) {
			return key;
		}
	}
	return null;
}
*/

export const PunctuationLexemes: { [key: number]: string } = Object.entries(PunctuationData).reduce(
	(acc, [key, data]) => {
		acc[data.name] = key;
		return acc;
	},
	{} as { [key: number]: string }
);


/** Automatically isolates all punctuation marks required by the prelexer, which, in addition to spaces, separate lexemes from each other. */
export const Demarcators = Object.entries(PunctuationData)
	.filter(([_, data]) => data.demarcating)
	.reduce((acc, [key, data]) => {
		acc[key] = data.unambiguous;
		return acc;
	}, {} as { [key: string]: boolean });

	
//

Deno.test({
	name: "Lexer.Tokens",
	permissions: { read: true },
	fn: () => {
		/*
		console.log(Keywords);
		console.log(Punctuations);
		*/
		
		// Guarantee consistent and clear numbering of all unique lexemes:
		assertLess(Keyword.Xor, FirstPunctuationValue);

		// Guarantee that all unique lexemes are mapped:
		const no_keywords = Object.keys(Keyword).filter(key => isNaN(Number(key))).length;
		assertEquals(no_keywords, Object.keys(Keywords).length);

		const no_punctuations = Object.keys(Punctuation).filter(key => isNaN(Number(key))).length;
		assertEquals(no_punctuations, Object.keys(PunctuationData).length);

		//console.log(clinging_punctuations);
	}
});