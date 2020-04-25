---
title: "Day 0"
date: 2020-04-24T15:37:53-07:00
draft: true
---

## Starting Fresh

After years of neglect, it is time to revive this website. Instead of making promises about the future, let's just
dive right in with some Raspberry Pi!

I've been using the Pi since the version 1 days and still can't believe how capable the hardware is. Recent projects
at my [work](https://pyramidacceptors.com) have inspired an interest in hid touch peripherals.  I figured
it would be a good time to try out the latest Ubuntu, Focal Fossa, since it is running the latest kernel. I also want to
give a 64-bit kernel a shot so I settled on settled on a terrific build from [Exton](http://raspex.exton.se/). Using
my Raspberry Pi B 3+, I burned the image to my SD card and waited.

On first boot, the system was responsive and my 7" touchscreen worked right out of the box. Networking was functional and
all I had to do was resize file system for a bit more leg room. After tweaking the installed applications, namely removing
Samba and VNC, I went for a reboot. To my surprise, the reboot appeared to hang at the login screen. I wait a few minutes
and assume that something went wrong so I cut the power and try again. Same thing!

Luckily `systemd-analyze` can help solve precisely this issue.

{{< highlight go >}} systemd-analyze blame {{< /highlight >}}