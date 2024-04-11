# Portions of this file are auto-maintained. Place all your edits after the "-include" line below!
# See https://confluence.vectra.io/display/DUBOPS/Unified+CI+Pipeline+onboarding
# This file came from build-tools/project_setup/Makefile

# In order to use `make setup` with docker, your ssh key configured for bitbucket should be without a passphrase.
# Otherwise you'll need to use the following local command `make setup_local`
# For key setup, please see https://confluence.vectra.io/display/DUBOPS/2022/03/22/Docker+build+ssh+failures+against+Sourcecode

# If make setup fails with /root/.ssh/config: line 2: Bad configuration option: usekeychain
# Please add IgnoreUnknown UseKeychain to ~/.ssh/config

# Version 2022-12-27

SHELL := /bin/bash

BUILD_TOOLS_BRANCH ?= 'master'
BUILD_TOOLS_MAKEFILES_PATH ?=  $(shell pwd)/.Makefiles

# Try to keep this version in-line with .Makefiles/Commands/git.mk
GIT_SETUP := docker run --rm \
	--workdir /app \
	-v $(shell pwd):/app \
	-v ~/.ssh:/root/.ssh:ro \
	alpine/git:v2.32.0

# after a successful run, the README.md will exist, preventing this target from running
.PHONY: get_archive
get_archive:
	@echo "build-tools branch is $(BUILD_TOOLS_BRANCH)"
	@echo "build-tools path is $(BUILD_TOOLS_MAKEFILES_PATH)"
	@mkdir -p $(BUILD_TOOLS_MAKEFILES_PATH)
	@$(GIT_SETUP) \
		archive \
		--format=tar \
		--remote=ssh://git@sourcecode.vectra.io:7999/sp/build-tools.git \
		$(BUILD_TOOLS_BRANCH):Makefiles | tar -xf - -C $(BUILD_TOOLS_MAKEFILES_PATH); \
	if [ $${PIPESTATUS[0]} -ne 0 ]; then printf "\nDownloading the build-tools repo failed, check the error above or try \"make setup_local\"\n" >&2; exit 1;fi

.PHONY: get_archive_local
get_archive_local:
	@echo "build-tools branch is $(BUILD_TOOLS_BRANCH)"
	@echo "build-tools path is $(BUILD_TOOLS_MAKEFILES_PATH)"
	@mkdir -p $(BUILD_TOOLS_MAKEFILES_PATH)
	@git \
		archive \
		--format=tar \
		--remote=ssh://git@sourcecode.vectra.io:7999/sp/build-tools.git \
		$(BUILD_TOOLS_BRANCH):Makefiles | tar -xf - -C $(BUILD_TOOLS_MAKEFILES_PATH); \
	if [ $${PIPESTATUS[0]} -ne 0 ]; then printf "\nDownloading the build-tools repo failed, check the error above\n" >&2; exit 1;fi

.PHONY: reset
reset:
	rm -rf $(BUILD_TOOLS_MAKEFILES_PATH)
	$(MAKE) setup

.PHONY: reset_local
reset_local:
	rm -rf $(BUILD_TOOLS_MAKEFILES_PATH)
	$(MAKE) setup_local

.PHONY: setup
setup: get_archive setup_custom
	$(MAKE) -f Makefile repo_setup_trigger
	@echo "build-tools setup complete"

.PHONY: setup_local
setup_local: get_archive_local
	$(MAKE) -f Makefile repo_setup_trigger
	@echo "build-tools local setup complete"

# This comment at the end of the below line is needed to maintain backwards compatability with the old KEEP_KEY for make update
-include $(BUILD_TOOLS_MAKEFILES_PATH)/main.mk # Makefiles/main.mk


# EDIT below this line
# Note: your commands must be indented with TABS. Spaces will not work.

# Change this to the AWS account where integration tests will run. Integration tests usually only run in a dev account.
INTEGRATION_ACCOUNT = "saas-app-dev"

# Change this to the relative path where python modules exist
PYTHON_MODULES = src

# (OPTIONAL)
# FIND_EXCLUDE_LOCAL must have the same format as the FIND_EXCLUDE
# e.g. FIND_EXCLUDE_LOCAL = -not -path "some/folders/*" -not -path "*/tobeignored/*"
FIND_EXCLUDE_LOCAL = 

#Add any custom setup that happens during "make setup"
.PHONY: setup_custom
setup_custom:
	echo ""


#Opt in to snyk scans failing the build if issues are detected in images
SNYK_FAIL_BUILDS := true


#Opt in to `make vdg-check` failing the build if Terraform module README.md files are not included or are out of date
VDG_FAIL_BUILDS := true
