[Intro](README.md) -- [Application Features](Application_features.md) -- **Road Map** -- [LND API Coverage](LNDAPICoverage.md) -- [Application Configurations](Application_configurations)

# Product Roadmap for RTL Application

## High Level Goals

### Multi-node Management
We want to provide users an ability to manage multiple-nodes via a single UI. The idea is to provide a top-level page, which will list all the nodes which are configured for RTL. User would be able drill down to each node from that page and manage nodes from a single RTL instance.

### RTL installer
Automate RTL setup so that installation process is simpler than the current method of following the steps provided in the Readme file. This should also help with configuration of nginx and letsencrypt, to enable access via https. Contribution on this is more than welcome.

### Better Mobile UX
Current UX for mobile users is less than optimal. We are attempting to provide a responsive UI, so that users can access the same app via browser on any device. This requires more UX optimization for mobile resolution.

### C-Lightning
We want to extend the RTL UI framework to other lightning node implementations as well. The current architecture can support it without major re-engineering, as we have an api abstraction layer written in nodejs. Additionally, projects like [Lighter](https://gitlab.com/inbitcoin/lighter), offer a lot of promise to speed up the development process for this.

### Globalization
Multi-language support. We can provide a customizable framework for multi-language support. But to extend support for other languages would require contribution from the development community, to use the framework and create multi-language support.

### Ongoing UX improvement
We believe UX improvement is a never-ending cycle. And, we must keep the UI/UX fresh and optimal with ongoing user feedback and inputs from UX subject-matter-experts. Contribution on UX suggestions is more than welcome and we have created a project to exclusively focus on UX issues and priorities. 
Automated Testing – As the functional complexity increases, we need to add automated testing to ensure quality and less bugs. Another area, where developer contribution is more than welcome.

## Feature Backlog
### Channel re-balancing
- Self routing to re-balance channels
### Invoice Management
- Lookup Invoice
### Network
- Network explorer
### Start
- Create Wallet
