+++
title = "My First Snap"
date = 2022-04-15T11:41:42-07:00
draft = false
categories = ["Development"]
tags = ["Snap", "Linux"]
+++

Software dependency problems are always fun to solve. Have you ever had your application pick up the wrong shared library from your path and then crash at the worst possible time?
Are you tired of trying to control which quirky version of a library you depend on? Full-stack developers solved this problem with containers and now we can use the same technology
to build and share desktop applications. Canonical, the publisher of Ubuntu, has a technology called snaps that provides this service. In a nutshell, snaps provide a sandboxed 
environment in which developers can bundle their apps including all their weird dependencies. Developers win by eliminating the friction of complicated setups. Users win by being
able to run more applications more easily and more securely, at least in theory. We'll test both sides of the experience in this article.

## The Binary

I needed a simple application to quickly perform trivial transforms on data like XOR, hex encoding, and binary encoding in a specific output format. Instead of making a complicated
chain of pipes, I chose to write my app. Since I use this application on multiple lab and VM machines I thought it would be cool to have it available as a snap. 

## The process

1. Install `snapd` using your preferred package manager (if not already installed)
2. Install `snapcraft` using snap itself

    `$ sudo snap install snapcraft --classic`

3. Write your code to do its thing (mask in this case)
4. Define your snap file in YAML
5. Build your snap 

    `snapcraft`
    
6. Install and test your snap

    `$ sudo snap install --devmode path/to/your_package.snap`
    

## CMake specifics

The snap system uses what are called plugins which serve as the driver for building your code. I am most interested in CMake so we'll be going over its specifics.

Regardless of your plugin, you need this metadata stanza to describe your package:

    name: mask
    base: core20
    version: '0.1'
    summary: The binary masking tool
    description: |
    This tool provides basic binary operations like XOR and HEX on string
    or stdin inputs. Nothing special, just wanted to write a snap.


During development, you can set these values to allow unrestricted access to the system. You'll need to tighten this up before publishing.

    grade: devel
    confinement: devmode

This section is what exposes features in your package. In this case, we have our binary compiled and installed to `/usr/bin` within our sandbox. Note that our
package name is `mask` which matches the command `mask`. Snaps are called using `package name`.`command` name syntax but if the package name and command are 
the same it will be simplified, in this case to `mask`. Also not the lack of leading forward slash on the command.

    apps:
      mask:
        command: usr/bin/mask

Now for the CMake specific stuff! Here we're telling snapcraft to use the CMake builder, specifying that our CMakeList.txt file is in the current directory (.),
and to place our install under `/usr`. Finally, our program requires g++ to compile so we will include that in our build packages list. If you are writing a 
C application then you would use GCC or whatever C compiler you need. We don't have any other dependencies so this is a brief list.

    parts:
      cmake-build:
        plugin: cmake
        cmake-parameters:
                - -DCMAKE_INSTALL_PREFIX=/usr
        source: .
        build-packages:
                - g++


The CMake builder plugin issues an install command so your CMakeList.txt file must define an install directive. We achieve this with

    install(TARGETS ${PROJECT_NAME} DESTINATION bin)

## Final Verdict

The whole process took about 20 minutes which is in line with the suggested time on the snapcraft IO tutorial site. Overall, the docs were sufficient and I did not
have much trouble after switching to my Fedora box. My first attempt was on WSL which kinda-sorta worked but `snapd` kept crashing. The CMake-specific stuff took a 
few minutes to figure out. Specifically, the compiler had to be listed in the build-package section. The reasoning makes sense now that I'm familiar with the 
process. Also, the explicit CMake install directive was missing in my first iteration but since I know CMake, this wasn't an issue. A developer less experienced with
CMake may have gotten stuck here. I think the CMake plugin should throw an error if there is no install target defined in the CMakeList.txt.

Snaps deliver on its promise and I'd love to see the technology ported to Windows.