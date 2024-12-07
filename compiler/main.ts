

async function main() {
	console.log("Hallo from Zuse!");

	// Access command-line arguments (excluding "deno" and the script name)
	const args = Deno.args;
	console.log("Arguments:", args);

	// Example: Basic argument handling
	if (args.length === 0) {
		console.log("No arguments provided. Use --help for usage information.");
		return;
	}

	if (args.includes("--help")) {
		console.log("Usage: deno run --allow-read your_script.ts [options]");
		console.log("--help           Show this help message");
		return;
	}

	// Main program logic here
	console.log("Processing your request...");
	// You can add further logic based on the arguments
}


// Execute main if this script is run directly
if (import.meta.main) {
	main();
}