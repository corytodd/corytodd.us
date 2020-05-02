+++
title = "Dirmon Utility"
date = 2020-05-01T15:02:59-07:00
draft = false
categories = ["Development"]
tags = ["Windows"]
+++

I like to learn how programs work. Sometimes that means watching the installation process using several tools 
from Sysinternals[^1] or Nirsoft[^2]. For today's program of interest, I noticed a large number of files being 
written to the ProgramDirectory for this application. I found this a little suspicious since temporary and 
config files should typically be written to the appropriate %AppData% folder. The files did not stay on disk 
long enough for me to see their names but I saw them flash in the file explorer which was enough to make me 
curious about their nature.

## Procmon

My first step in the analysis is to just sit and watch. Sysinternals provides a tremendous amount of tools that address these
types of tasks. In this case, I chose [Procmon](https://docs.microsoft.com/en-us/sysinternals/downloads/procmon) to see exactly what files were getting created and deleted. The first step is
to set up some filters to focus on the target process and the actions that we suspect are happening. Start simple and add 
more filters so you don't accidentally over-filter the results. This also helps you learn what operations and activities 
can be used in your filter. For example, unless I'm inspecting the registry activity, I will exclude all registry activity 
in my filter to avoid the excessive noise.

- Process Name : Limit monitoring to actions performed by only this process
- Operation : Only log operations that are of this type

![Filter][img_1]

With the filter in place, launching my application triggered several results. I could see about 5 different files being,
written, then finally deleted all within a few milliseconds.

## File Spy

Sysmon is the tool of choice for this type of problem because it has options _specifically_ for capturing file content as 
data comes and goes. However, to fully appreciate the value of this tool I thought it would be a good exercise to develop my
own, specific solution. Right off the bat, I know the challenges are going to be:

1) Getting correct file read access
2) Reading the file before it gets deleted
3) Not affecting the target process.

I decided to build my solution around the [FileSystemWatcher](https://docs.microsoft.com/en-us/dotnet/api/system.io.filesystemwatcher?view=netcore-3.1) API using dotnet core. Starting from the APIs sample implementation, getting a directory watcher up and running is trivial.


### Basic Approach

{{< highlight csharp >}}// Create a new FileSystemWatcher and set its properties.
_watcher = new FileSystemWatcher
{
    Path = MonitorDir,
    // Watch for changes in LastAccess and LastWrite times, and
    // the renaming of files or directories.
    NotifyFilter = NotifyFilters.LastAccess
                    | NotifyFilters.LastWrite
                    | NotifyFilters.FileName
                    | NotifyFilters.DirectoryName,
    Filter = pattern
};

// Add event handlers.
_watcher.Changed += OnChanged;
_watcher.Created += OnCreated;
_watcher.Deleted += OnDeleted;
_watcher.Renamed += OnRenamed;
{{< /highlight >}}

Since we care about the file contents more than anything else, `OnChanged` is the only handler that matters. The others will just log the event and immediately return.
The naive approach:
{{< highlight csharp >}}private static void OnCreated(object source, FileSystemEventArgs e)
{
    var text = File.ReadAllText(e.FullPath)
    Logger.Info("Snapshot: {0}> {1}", e.FullPath, text);
}
{{< /highlight >}}

has a few problems. The most obvious being that ReadAllText does not open the file in shared mode. The may cause the creating process to error out if it is expecting
to have exclusive access to the file. Instead, we will need to explicitly set the file sharing mode.
{{< highlight csharp >}}private static void OnCreated(object source, FileSystemEventArgs e)
{
    var fs = new FileStream(e.FullPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
    using (var sr = new StreamReader(fs))
    {
        var text = sr.ReadToEnd();
        Logger.Info("Snapshot: {0}> {1}", e.FullPath, text);
    }
}
{{< /highlight >}}

This is better and prevents the issue of locking the file inadvertently. However, logging all of this to the console or to file gets out of hand very quickly. A better
solution is to sequence each change and then write the results to a backup location. Dirmon uses what we call a shadow directory to receive these sequence change 
records. Since writing to disk can be slow, we delegate the task of actually writing the files to a background thread.

### Refined Approach

Here we create a second method called `OnChangeFast` to handle this specific design.
{{< highlight csharp >}}private void OnChangeFast(object source, FileSystemEventArgs e)
{
    // We only care about change to non-directories
    if (e.ChangeType != WatcherChangeTypes.Changed || IsDirectory(e.FullPath))
    {
        return;
    }

    try
    {
        // Attempt to capture contents without locking the file
        var fs = new FileStream(e.FullPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using (var sr = new StreamReader(fs))
        {
            var text = sr.ReadToEnd();

            // We have the contents, determine what change number this is
            if (!_sequenceCache.TryGetValue(e.FullPath, out var seq))
            {
                seq = 0;
            }

            _sequenceCache.TryAdd(e.FullPath, seq + 1);

            // Commit this snapshot
            _memoryDb.Enqueue(new FileSnapshot(seq, Path.GetFileName(e.FullPath), text));
        }

        // Signal data ready
        _memoryReady.Release();
    }
    catch (Exception ex)
    {
        Logger.Error(ex, "OnChangeFast Error ({0} {1})", e.FullPath, e.ChangeType);
    }
}
{{< /highlight >}}

Some things to highlight:

* _memoryDb is a concurrent dictionary
* _memoryReady is a SemaphoreSlim that is incremented every time a snapshot is added to _memoryDb
* _sequenceCache holds a running counter for each file name. Since a directory cannot hold more than one file with the same this is sufficient.


## Final Thoughts

Having made my rudimentary solution I have a better understanding of the problems that Sysmon can solve. The latter is designed for reliable, 
high-performance analysis, even for kernel-mode processes. My solution, while fun, is not sufficient in terms of robustness or reliability and 
may miss certain events, especially in the case of malicious software. The full source code for Dirmon can be found on my [Github](https://github.com/ardonyx/dirmon).

[^1]: https://docs.microsoft.com/en-us/sysinternals/
[^2]: https://www.nirsoft.net/

[img_1]: /img/procmon_filter.jpg