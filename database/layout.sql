/*

CONTENTS
	1 AUTHORSHIP AND MAINTAINERS
	2 PLANS
	3 REPOSITORIES AND LIBRARIES
	4 BUILD PROFILES

*/

-- 1 AUTHORSHIP AND MAINTAINERS

create table Contributor (
		-- Contributor as an overarching collective term that also includes authors and maintainers on a project.
	email Text not null,
	name Text not null,
	maintaining Integer not null default 0 check (uploading in (0, 1)),
		-- Is the contributor also a maintainer of the project?

	constraint "email address as primary key to a contributor" primary key (email),
	
	constraint "formally correct email address of a contributor" check (
		email regexp '^[^\s@]+@[^\s@]+\.[^\s@]+$'
	),
	constraint "no unnecessary spaces in a contributor's name" check (
		name regexp '^[^\s].*[^\s]$' and value not like '%  %'
	)	
);


create table Author (
	email Text not null,
	from_year Integer not null default (strftime('%Y', 'now')),
	to_year Integer default null,

	constraint "composite primary key to an author" primary key (email, from_year),
	
	constraint "known email address of an author"
		foreign key (email) references Contributor(email),

	constraint "valid information about the time when an author was activer" check (
		from_year >= 1950 and from_year <= strftime('%Y', 'now') and from_year <= to_year
	)
);


create table Copyright (
	author Text not null,
	year Integer not null default (strftime('%Y', 'now')),
	component Text not null,
	identifier Text default null, 

	constraint "composite primary key to an author" primary key (author, year),
	
	constraint "known author owning rights to certain code"
		foreign key (author, year) references Author(email, from_year),

	constraint "valid component name" check (
		component regexp …
	),

	constraint "valid identifier" check (
		identifier regexp …
	)
);


-- 2 PLANS

create table Plan (
		-- Important data on each subproject, required for building test and release versions, as well distributable archives.
	name Text not null,
	export_name Text default null,
		-- Specifies the default name for use in other projects.

	license Text not null default 'Proprietary' check (license in (
		'Copyleft', 'AGPL', 'CPL', 'EPL', 'GPL', 'LGPL', 'MPL',
		'Permissive', 'Apache', 'BSD0', 'BSD2', 'BSD3', 'BSD4', 'CC0', 'ISC', 'MIT', 'Unlicense',
		'Proprietary'
	)),
		-- The variants 'Copyleft' and 'Permissive' are intended for other free licenses not listed here.

	title Text not null check (trim(title) <> '' and length(title) <= 50),
		-- Name of the project in the actual spelling with which the software is advertised.
	description Text not null default '' check (length(description) <= 250),
		-- Short description text that explains the purpose.

	major Integer not null default 0,
		-- Indicates significant changes or backward-incompatible update.
	minor Integer not null default 1,
		-- Signifies backward-compatible feature additions.
	patch Integer not null default 0,
		-- Denotes backward-compatible bug fixes.
	pre_release_type Text default 'dev' check (pre_release_type in ('dev', 'a', 'b', 'rc')),
	/*
		dev │ Still in early development phase
		  a │ Alpha release for first test phase despite missing features
		  b │ Beta release with all intended features but still possible bugs or performance issues
		 rc │ Stable release candidate potentially ready for final distribution, provided that no critical issues are found during testing
	*/
	pre_release_iteration Integer default 1,
	build Integer not null default 0,
		-- Increases with each compilation and is reset to 0 when the rest of the version number changes.
		-- Possible output formats: MAJOR.MINOR.PATCH-BUILD | MAJOR.MINOR.PATCH-PRTYPE.PRITERATION+build.BUILDNUMBER

	alt_version Text default null check (trim(alt_version) <> ''),
		-- Alternative versioning, which is not subject to any restrictions. Could also be a version name for marketing reasons.

	ffi Text default null check (ffi in ('C', 'C++', 'JS')),
		-- Does the code interoperate directly with one of the listed languages ​​and require appropriate compilers or environments?

	indent integer not null default 0 check (indent = 0 or >= 2 and indent <= 8),
		-- Zero stands for tabs; whereas 2 to 8 stand for the number of spaces at the beginning of the line, which count as one indentation.
	main Integer not null default 0 check (main in (0, 1)),
		-- Main plans can be processed directly with the commands 'zuse build' or 'zuse run' without being named.
	proven Integer not null default 0 check (proven in (0, 1)),
		-- Has the software proven to be reliable and error-free, so that additional security measures at runtime to detect errors are no longer required?

	constraint "unique plan name as primary key" primary key (name),
	constraint "unique export name of a plan" unique (name),

	constraint "valid lowercase name of a plan" check (
		name regexp '^[a-z](-?[a-z0-9]+)*(_[a-z](-?[a-z0-9]+)*)*$'
	),
	constraint "valid capitalized export name of a plan" check (
		export_name regexp '^[A-Z](-?[A-Za-z0-9]+)*$'
	),
	constraint "export name correlates with plan name" check (
		case instr(replace(name, '-', ''), lower(replace(export_name, '-', '')))
			when 1 then true
			when 4 then name like 'lib%'
			else false
		end
	),
	constraint "valid version of a plan" check (
		major between 0 and 9999 and
		minor between 0 and 9999 and
		not (major = 0 and minor = 0) and
		patch between 0 and 999999999 and
		pre_release_iteration between 0 and 999999999 and
		build between 0 and 999999999
	)
);

create unique index "unique main plan" on plan(main) where main = 1;


-- 3 REPOSITORIES AND LIBRARIES

create table Repo (
		-- A repository is a collection of archived and versioned program .
	id Text not null,
	scheme Text not null default 'file' check (scheme in ('file', 'http', 'https')),
	path Text not null,
		-- Paths to online repositories must consist of at least TLD and SLD and may be divided by publisher, as is the case with GitHub: “github.com/qt”.
	login_id Text default null,
	login_pw Blob default null,
		-- To automatically log in to protected repositories.
	uploading Integer not null default 0 check (uploading in (0, 1)),
		-- Should the project be published in this repository?
	
	constraint "unique repository id as primary key" primary key (id),
	constraint "unique URL to a repository" unique (path),

	constraint "valid capitalized name of a repository with optional namespace" check (
		id regexp '^[A-Z](-?[A-Za-z0-9]+)*(.[A-Z](-?[A-Za-z0-9]+)*)*$'
	),
	constraint "formally correct path to a repository" check (
		case scheme
			when 'file' then path regexp '^(\.)?/([^/]+/)*$' -- Relative paths like '../' are intentionally not wanted.
			else path regexp '^([a-z0-9](-?[a-z0-9]+)*)(\.[a-z0-9](-?[a-z0-9]+)*)+(/[a-z0-9](-?[a-z0-9]+)*)*/$'
		end
	),
	constraint "only path of id 'Local' may and must be relative" check (
		(id = 'Local') = (path like './%')
	),
	constraint "complete login details to a locked repository" check (
		login_id is null and login_pw is null or login_id is not null and login_pw is not null
	)
);

--

insert into Repo (id, scheme, path) values
	('Public', 'https', 'plans.kalkyl.dev/'),
		-- Public and official repository of Kalkyl to obtain plans as versioned archive files.
	('Local', 'file', './plan/');
		-- Sources referenced by relative paths are considered internal to the project and hence require unpacked plans. Consequently, the path './plan/' points to the source directory of a project.

--

create table Lib (
		-- Program libraries of specific versions that may be used.
	repo_id Text not null,
	name Text not null,
		-- Corresponds to the directory name for project-internal libraries or the name of the archive file obtained from external sources.
	import_name Text not null,
		-- Under what name should the library be available when imported using the declaration `use`?
	major Integer default null,
	minor Integer default null,
		-- Version numbers may only be null for project-internal libraries.

	constraint "composite primary key to a dependency" primary key (repo_id, name),
	constraint "unique import name of a library" unique (name),

	constraint "known repository of a library"
		foreign key (repo_id) references Repo(id),
	
	constraint "valid library name of a dependency" check (
		name regexp '^lib[a-z](-?[a-z0-9]+)*$'
	),
	constraint "valid import name of a library" check (
		id regexp '^[A-Z](-?[A-Za-z0-9]+)*$'
	),
	constraint "valid library version of a dependency" check (
		(major between 0 and 9999) and (minor between 0 and 9999) and ((major = 0) <> (minor = 0))
	),
	constraint "only libraries from 'Local' are unversioned" check (
		(repo_id = 'Local' and major is null and minor is null) or
		(repo_id <> 'Local' and major is not null and minor is not null)
	)
);


-- 4 BUILD PROFILES

create table Build (
		-- Saves complex builds under a name with additional information about what the build is intended for. A build describes a complex compilation with numerous fine-tuning options so that these settings do not have to be entered again or called by a separate shell script
	name Text not null,
	plan Text not null,
		-- The build named 'default' do not need to be explicitly called: zuse build
	note Text not null default '' check (length(note) <= 150),

	dynamic Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library be linked statically (0) or dynamically (1)?
	bundled Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library be compiled with all its own dependencies or rely on installed system libraries?
	unsecured_memory Integer not null default 0 check (uploading in (0, 1)),
		-- Should the program forego security mechanisms in dynamic memory management for performance reasons?

	constraint "composite primary key to a build" primary key (name, plan),

	constraint "known plan to be built"
		foreign key (plan) references Plan(name),
	
	constraint "valid built name" check (
		name regexp '^[a-z](-?[a-z0-9]+)*$'
	)
);

--

create table Option (
		-- 
	name Text not null,
	value Text not null,

	dynamic Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library be linked statically (0) or dynamically (1)?
	bundled Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library be compiled with all its own dependencies or rely on installed system version?
	unsecured_memory Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library forego security mechanisms in dynamic memory management for performance reasons?

	constraint "composite primary key to a dependency" primary key (build, lib),

	constraint "known repository of a library"
		foreign key (repo_id) references Repo(id),
	
	constraint "valid library name of a dependency" check (
		lib_name regexp '^[a-z](-?[a-z0-9]+)*$'
	),
	constraint "valid library version of a dependency" check (
		major >= 0 and major <= 9999 and minor >= 0 and minor <= 9999 and ((major = 0) <> (major = 0))
	)
);


/*
create table Dep (
		-- 
	build Text not null,
	lib Text not null,

	dynamic Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library be linked statically (0) or dynamically (1)?
	bundled Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library be compiled with all its own dependencies or rely on installed system version?
	unsecured_memory Integer not null default 0 check (uploading in (0, 1)),
		-- Should the library forego security mechanisms in dynamic memory management for performance reasons?

	constraint "composite primary key to a dependency" primary key (build, lib),

	constraint "known repository of a library"
		foreign key (repo_id) references Repo(id),
	
	constraint "valid library name of a dependency" check (
		lib_name regexp '^[a-z](-?[a-z0-9]+)*$'
	),
	constraint "valid library version of a dependency" check (
		major >= 0 and major <= 9999 and minor >= 0 and minor <= 9999 and ((major = 0) <> (major = 0))
	)
);
*/