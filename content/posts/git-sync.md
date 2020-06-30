+++
title = "Git Merge Alias"
date = 2020-06-28T09:31:42-07:00
draft = true
categories = ["Development"]
tags = ["Git"]
+++

I am a strong advocate for using a coherent branching model when collaborating on software projects. It can be a full git-flow pattern,
maybe GitHub flow, or some hybrid between them. There as many ways to do it as there are developers. Just be self-consistent and we'll
work well together. One feature that's common across all branching models is the need for your target branches in sync. For example,
with git-flow you cannot finish a feature if your local develop is behind origin develop. The solution is simple enough

    git fetch origin develop:develop
    
This says to update (or create) your local develop branch based on the latest develop branch on origin[^1]. This is equivalent to

    git checkout develop
    git fetch
    git pull
    
Note that the equivalence is only valid if your merge can be fast-forwarded. If you made the mistake of making local develop changes
that now conflict with origin, you are on your own.

Well, the odds of remembering that and _not_ having to search Stack Overflow again are slim. Instead, we can make an alias to make this
a little easier to remember. These two aliases can be added to your git config to enable syncing on a specified branch or a hardcoded
branch. Your choice.

    [alias]
        sync = "!f(){ git fetch origin ${1}:${1}; };f"
        synca = "!f(){ git fetch origin develop:develop && git fetch origin master:master; };f"
        
The ${1} takes the first argument following your alias command.

    git synca        // fetch and sync both develop and master branches without disturbing your current branch
    git sync develop // fetch and pull just develop without disturbing your current branch
            
That's all for today!

[^1] https://git-scm.com/docs/git-fetch#_examples