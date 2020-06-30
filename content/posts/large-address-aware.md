+++
title = "Large Address Aware"
date = 2020-06-26T07:12:47-07:00
draft = false
categories = ["Development"]
tags = ["MSVC", "Windows"]
+++

I recently encountered an interesting issue while integrating some legacy code into a 64-bit DLL. I can't name the vendor nor the library but I will say it is a solid piece of software that works as advertised. One quirk of the 64-bit version is that it does not work binaries that are marked as large address aware (LAA). Up until recently, this has not been an issue because our compilers never set that flag, nor would it make sense to. LAA does not make any sense for a Dll since it is up to the executable to provide the address space.

The day finally came where we needed to use some C++17 features on MSVC which required VS 15.7. Since we use CMake, this process is mostly transparent and our quirks
files take care of the oddities on each compiler. What we were not prepared for was the new option `LARGEADDRESSAWARE:ON` to be the default. Furthermore, you can't
set it to off because then compiler yells at you - "Dlls don't support this feature". Well yeah, then why is it default to on for a dynamic library?! Disabling the option at compile time is not possible which means we need to add an extra step our post process. Not a huge deal, we have the pipeline ready to go.

The solution depends on `editbin` which is part of the Windows SDK. You can find this on your developer command prompt or just peek in your VS install directory 
under `VC/Tools/MSVC/<version>/bin/<host>`.

    editbin /NOLOGO /LARGEADDRESSAWARE:NO libfoo.dll
    
    libfoo.dll : warning LNK4259: '/LARGEADDRESS:NO' is not compatible with '/HIGHENTROPYVA'; image may not run
    
Those warnings at the end are interesting. Apparently, the high entropy virtual address flag is set as well. Fortunately, we 
can clear that directly in the CMake file.

    if(MSVC)
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /HIGHENTROPYVA:NO")
        set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} /HIGHENTROPYVA:NO")
    endif(MSVC)
    
which enables the post process to finish without any warnings.

    editbin /NOLOGO /LARGEADDRESSAWARE:NO libfoo.dll
    
With these new features on the build system, we're back in business.    