+++
title = "Visual Studio and The Mysterious Additional Includes"
date = 2020-06-30T13:51:51-07:00
draft = false
categories = ["Development"]
tags = ["Windows", "MSVC"]
+++

There is no denying that Visual Studio is a fantastic tool. There is so much magic under the hood that you rarely have to think about
where your tools or how to get to them. If you're building strictly for Windows, you don't need to change too much to make a useful GUI or console utility. If you peek at the project properties, there are mostly sane defaults with very little in terms
of surprise and foot-guns.

Of course, all magic has a perfectly valid explanation. One such explanation is the global build props feature which has an interesting
and terrifying ability to modify all (new) projects you create with Visual Studio. Years ago I installed a particular tool to help me
isolate a particularly nasty GDI resource leak[^1]. The tool didn't work but I did find my leak! Of course, it was an HICON and yes, I
did feel foolish. Anyways, I removed the not-quite-useful leak detector and went on with my life. When I went to create a new project,
I noticed that there was an additional library that includes paths in the project. Paths that I didn't need and certainly didn't want. They
were pointing to the library path for the leak detector! How on earth could this happen? I figured the un-install went pear-shaped but
all signs indicated that it was removed. No sign of it in the registry, program files, or even my AppData folder. Since no actual libraries were getting linked I ignored the problem and went on with my life. Just a minor annoyance.

Well, a few years go by and I eventually upgrade my hardware and install Windows after a bad experience with the Win 10 insiders program.
Once the dust settled, I got back to work writing some code and was utterly shocked that the mysterious link references were still getting
injected into my new projects! Except for my home directory, this was an entirely fresh installation.

After some research, I learned about global build props. There is a folder

    %AppData%\Local\Microsoft\MSBuild\v4.0\
    
that holds a smattering of files that can be written in such a way that VS will use them for certain defaults. The docs are not shy about
saying these are a bad idea[^2]. Before the days of version control and distributed projects, this was probably a very useful
feature. The replacement technology, Props Sheets, is superior in just about every way so I don't see any reason to return to the old ways. 

[^1] https://docs.microsoft.com/en-us/archive/msdn-magazine/2001/march/resource-leaks-detecting-locating-and-repairing-your-leaky-gdi-code
[^2] https://docs.microsoft.com/en-us/cpp/build/create-reusable-property-configurations?view=vs-2019