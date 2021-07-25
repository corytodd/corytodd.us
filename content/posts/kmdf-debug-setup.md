+++
title = "KMDF Debugger Setup"
date = 2020-07-30T09:58:23-07:00
draft = false
categories = ["Development"]
tags = ["Driver", "VisualStudio"]
+++

Developing drivers for Windows is enjoyable but getting up and running takes some time. Today we'll be walking through the steps required to get a minimal debugger setup. When you've completed these steps, you will be ready to debug a basic Windows driver in kernel mode.

### Environment
- Host
  - Windows 10 x64 20H2
  - Visual Studio Community 2019 16.10.4
  - Windows Driver Kit
  - Spectre Mitigated Libraries
  - VMWare Workstation 16.0
- Target
  - [WinDev2106Eval.VMware.zip](https://developer.microsoft.com/en-us/windows/downloads/virtual-machines/)
  - Host-Only Networking

## Host Setup Part 1

After you install Visual Studio 2019, navigate to `Tools->Get Tools and Features` to install some additional components. Select the individual components tabs and search for `spectre latest x64` then check the box next to `MSVC vXXX - VS2019 C++ x64/x86 Spectre-mitigated libs (Latest)` where XXX will be the toolchain version. Next, search for `driver kit` then check the box next to `Windows Driver Kit`. On the bottom right, click Modify and wait for the process to complete.

Create a new project using one of the KMDF project templates available in Visual Studio. I chose Kernel Mode Driver (KMDF) for this walk-through. Wait for the project to load then switch the solution platform to x64 and try to build the project. If your environment is correct, the project should build without any errors or warnings. You may see some Intellisense errors about not being able to find some .tmh files. Don't worry about those for now.

## Guest Setup

Once you have downloaded the VMWare Windows 10 development image from Microsoft, import the OVA into VMWare Workstation. If your host can spare the resources, consider increasing your guest RAM to 4GB and your processor core count to 2 for a better debugging experience.

VMWare will boot your Windows 10 image and log in to the desktop. The next step is to install the WDK Test Target package which can be found on your host system as  `C:\Program Files (x86)\Windows Kits\10\Remote\x64\WDK Test Target Setup x64-x64_en-us.msi`. Copy this file to your guest VM then run it. 

Next, you will need to determine your networking information. Ensure that your VM is using a Host-Only network the grab your IP address. The default network should be in the `192.168.x.y` range. This information is needed to determine your host address which will be `192.168.x.1` where `x` is the second to last octet in your VM's IP address. Write this down for later.

Finally, you will need to know the VM's hostname. The default hostname as of writing this post is `WINDEV2106EVAL` but be sure to confirm before proceeding.

*Make a VM snapshot before continuing!*

## Host Setup Part 2

Now that you have prepared the guest VM, we can continue configuring the debugger. Start by adding a new debugging target in Visual Studio. This can be done in several ways, one of which is to navigate to `Project Properties->Debugging` then select `Remote Computer Name`. Select `<Configure>` from the drop-down menu to launch the Configure Devices tool.

1. Click Add New Device
2. Name your device. e.g. Win 10 2106 VM
3. Set the hostname. e.g. WINDEV2106EVAL
4. Select Provision device and choose debugger settings
5. Click Next
6. Ensure Network is selected for Connection Type 
7. Change Host IP to `192.168.x.1` from the previous section
8. Click Next
9. Wait... some... time...
10. Finish

The guest is now ready to be debugged. Consider taking a snapshot of the VM before moving on to the next section.


## Deployment

So far we have created a Visual Studio environment that supports driver development and we've prepared a debuggable virtual machine hosted on VMWare Workstation. The last step is to deploy your driver and observe it populated in the target's device manager. From your project's property page, select `Driver-Install-> Deployment` and pick your target VM from the drop-down menu. Select `Install/Reinstall and Verify` then click Apply.

Deploy the driver by right-clicking on the project and selecting Deploy. This process may take a couple of minutes to complete. If the deployment succeeds, you will see your device in the target's device manager.

In another post, I'll walk you through connecting with the debugger, loading symbols, and setting a breakpoint.

### Troubleshooting

If during deployment you get an error complaining about a missing VC142 library you can run this command from an elevated console as a solution.

```
cd /d %VCToolsRedistDir%\debug_nonredist 
MKLINK /J x86\Microsoft.VC141.DebugCRT x86\Microsoft.VC142.DebugCRT MKLINK /J x64\Microsoft.VC141.DebugCRT x64\Microsoft.VC142.DebugCRT
```