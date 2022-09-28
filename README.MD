# <img src="./images/icon.svg" alt="Ripple" height="30"/>Ripple

This repository demostrate the xHookControl implementation on Ripple.

## Directory structure

```text
.
├── metadata.yaml             # metadata describing this integration
├── LICENSE                   # defaults to Apache, replace if that doesn't suit
├── README.md                 # this the files
├── _helpers                  # helpers lib
│  └── steps_helper.js           # Step helpers library
├── steps                     # subdirectory for execution steps
│  └── <StepName>                # rename this to your own step's name
|     ├── README.md              # detail about how to use this step
│     ├── <StepName>.js          # entrypoint script (plus any additional files)
      ├── icon.png/svg             # picture of workflow graph from app
│     └── step.yaml              # step metadata 
├── triggers                  # subdirectory for triggers
│  └── <TriggerName>             # rename this to your trigger's name
|     ├── README.md              # detail about how to use this trigger
│     ├── <TriggerName>.py       # Entrypoint webhook handler script
│     └── trigger.yaml           # trigger metadata
├── templates                 # mustache templating for WebAssembly creation
|  ├── README.md                 # detail about how to use this trigger
│  ├── <StepName1>.mustache      # ... 
│  └── <StepName2>.mustache      # trigger metadata
├── accounts                  # inline accounts
│  └── sg_backlists.csv         # accounts uses in workflows or templating
└── workflows                 # subdirectory for example workflows
   └── <WorkflowName>              # an example workflow
      ├── README.md                # how to use this workflow
      ├── icon.png/svg             # picture of workflow graph from app
      └── WorkflowName.yaml        # the workflow itself
```

## Reserved keywords

- parameters
- secrets
- output
- hookname
- step
- workflow

## Contributing

### Issues

Feel free to submit issues and enhancement requests.

### Contributing Code

In general, we follow the "fork-and-pull" Git workflow.

 1. **Fork** the repo on GitHub
 2. **Clone** the project to your own machine
 3. **Commit** changes to your own branch
 4. **Push** your work back up to your fork
 5. Submit a **Pull request** so that we can review your changes

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

### License

As indicated by the repository, this project is licensed under Apache 2.0.
