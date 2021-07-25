+++
title = "KMDF Debugger Connection"
date = 2021-07-25T08:31:32-07:00
draft = false
categories = ["Development"]
tags = ["Driver", "VisualStudio"]
+++

In my [previous post]({{< ref "/posts/kmdf-debug-prep" >}} "previous post") we covered the setup and deployment of a Windows driver to a virtual machine target. This post will walk you through the process of connecting WinDBG to the target to explore and step through the driver. By the end of this article, you will have symbols, breakpoints, WPP, and kdprint up and running.

### Requirements

- WinDbg x64 (or the new preview version)
- TraceView from WDK

### Driver Modification

We're going to start by modifying the driver to use KdPrint to show some debug information. WPP is very powerful but sometimes you just want to print messages to your debugger and KdPrint can do just that [with certain limitations](https://docs.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-kdprint#remarks). Go ahead and add a line of code inside `DriverEntry`, something along the lines

    KdPrint(("Hello DriverEntry: 0x%p", DriverObject));

This will show a string message and the address of our `DriverObject` handle formatted as a pointer. Rebuild and deploy your driver with this change in place. 

### Debugger Setup

The first step in debugging is to connect to the target. Since you're using visual studio, it may be tempting to try and debug from within Visual Studio. I have had mixed results getting this to work reliably but more importantly, WinDbg is more or less tooled specifically for driver development. We'll use the right tool for the job.

If you have not already done so, open WinDbg. We will need to get the port and connection key from Visual Studio before we can make WinDbg connect to the target. The port and key can be found on the page where you configured the debug target. The default port is something near 50000 and the key is a 48 character string split into 4 sets of 12 characters. These values will need to be placed in a connection string that WinDbg can use.

Here is a sample connection string. The server field is the hostname of your target. The port and password may be different in your environment. I recommend copying this string to notepad and editing it there.

    tcp:server=WINDEV2106EVAL,port=50431,password=AAAAAAAAAAAA.BBBBBBBBBBBB.CCCCCCCCCCCC.DDDDDDDDDDDD

Once you have built your connection string, go to WinDbg and go to File->Connect to the remote debugger (or CTRL+R). Paste in your connection string and click Ok. The debugger should connect and pause the target OS. This means you are connected and ready to debug!

The first order of business is to make KdPrint and friends work correctly. By default, kernel-debug print statements are not emitted from the target. You can change this by modifying the print mask variable `kd_DEFAULT_MASK` using the WinDbg command prompt.

    ed kd_DEFAULT_MASK 0xf

Next, you will want to set up your symbol path so breakpoints will work. This is done by using the `.sympath+` command as follows:

    .sympath+ H:\path\to\your\project\root

The path should be the folder containing the root of your driver project which typically contains the vcproj file. From here, WinDbg will automatically locate debug symbols and source code to aid in the debugging process. You will also need to force WinDbg to reload symbols which will take some time.

    .reload /f

Take a break and let this process run its course.

### KdPrint

By now all of your symbols should be reloaded. Finally, we can get to some actual debugging!. Let's set a breakpoint using the WinDbg command window. You need to know two pieces of information to set your breakpoint. The module name and the function/line to break on. Your module name by default is the project name without spaces. I named my project `vhid2` and I want to break at the driver's entry point so I'll enter the following:

    bm vhid2!DriverEntry

Once this breakpoint is set, you should be able to see KdPrint statements in the command window. The easiest way to see our message is to force `DriverEntry` to run. You can do this by disabled and enabling the driver from the Device Manager. If everything is correct, you should see "Hello DriverEntry: 0xFFFFC2056703EE30" in the command window (your address will be different). Go ahead type `g` or Go in your debugger to continue from the breakpoint. We will want to detach the debugger so the target VM doesn't stay in a breakpoint state. Use the detach command to release the debugger.

### WPP Tracings

That's not the only way to view logging information. WPP is the super-fast trace logging utility that supports a more powerful log filtering system. The project template we used already has WPP configured along with some sample trace statements. No changes are needed to your project to make them work. You will however need a copy of the `traceview` utility which can be found at 

    C:\Program Files (x86)\Windows Kits\10\Tools\x64\traceview.exe

Copy this file to your target VM. You will also need to copy over the PDB for your driver which should be located in the Debug folder of your project's root directory. My PDB is called vhid2.pdb. From your target VM, run `traceview` as administrator and click File->Create New Log Session. Select the PDB option and chose the PDB file you just copied over then click Okay->Next->Finish, accept all defaults along the way. You can get fancy and make a VM mount point that references your build directory but I'll leave that as an exercise to the reader. 

Use the same trick to force `DriverEntry` to run again and you will see your WPP trace statements appear in TraceView.

### Summary

In this post we walked through the process of connecting a kernel debugger, enabling KdPrint, and viewing WPP trace messages. With all that out of the way, you can start learning how to develop Windows drivers. Good luck!