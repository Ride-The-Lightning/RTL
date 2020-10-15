## Contributing to RTL
Thanks for your interest in contributing to the development of RTL. RTL is a community project and aspires to remain free and open source for the benefit of the community. With that objective in mind, this document provides contribution guidelines which the community can utilize to contribute towards the development and maintenance of this software.

### <a name="how"></a>How Can I Contribute
There are multiple ways you can contribute towards the development and not all of those methods involve coding. Below are a few examples on how meaningful contributions can be made.
* [Bug Report](#bug) - While using RTL, if you notice something is not working correctly create a bug report, by creating an issue.
* [Feature Request](#feature) - While using RTL, if you feel that the software should be changed in certain way to make it for usable and helpful, create a feature request.
* [Testing](#testing) - Testing is one the easiest and most sought after method of contribution. Testing can be done on release branches, so that releases are relatively bug free.
* [Design](#design) - Design inputs can be made based on user enhancement suggestions or novel ideas which you get while using RTL.
* [Code](#code) - Development contributions are made via making coding changes to the software and getting it tested, reviewed and merged.
* [Code Review](#codereview) - Code review contributions are made by reviewing the code changes submitted via PRs to address bugs or feature requests

#### <a name="bug"></a>Bug Report
Bug reports are reports of technical or functional issues with the software. Bug reports help with the removal of defects from the software and improve its quality. Guidelines for submitting a bug report:
* Label the bug with the correct Lightning implementation (LND/C-Lightning/Eclair).
* Add the `Bug` label to the issue
* Provide details of your configuration like Device, Operating system, Bitcoin version, Lightning implementation version, RTL version etc.
* Attempt to explain the scenario in detail, so that the developer can try to replicate the issue at their end.
* If the bug is with the UI, screenshots help. Try to highlight the problem areas by circling with red outline.
* Take care to redact sensitive info from the screenshots like Pubkey or channel IDs etc.
* Be responsive to the developers requesting details on the issues.

#### <a name="feature"></a>Feature Request
Feature Requests are requests raised to add new features to the application. The features requests can range from technical to functional, making the application better for everyone. Guidelines to follow for create a feature request:
* Label the feature request with the correct Lightning implementation (LND/C-Lightning/Eclair).
* Add the `Enhancement Request` label to the issue
* If the feature relates to an existing aspect of the application, indicate clearly which part of the application the feature request relates to. E.g. Transactions page under Lightning menu.
* Provide the justification for the feature request. E.g. Privacy/Security/Usability benefit.
* If the feature request is technical in nature, try to provide the platform detail like OS, Lightning Implementation version etc.
* For new UI features mockups are helpful for the developers.
* Be responsive on the feature requests when developers request details or clarification and also help with the testing of the features requested.

#### <a name="testing"></a>Testing
Testing is the easiest and most effective method to contribute. It helps uncover bugs and improve the quality of software. Best time to test would be pre-release, when the changes are being made to the software for the next release. RTL maintains a release branch for the next planned release and changes are merge to the release branch on a regular basis. The testers can contribute by pulling from the release branch and testing the software. If issues are found during testing, follow the steps described above to raise bug reports to help address the issues.

#### <a name="design"></a>Design
Design suggestions are always welcome and helpful. Design suggestion can range from improving both the aesthetics as well as the UX of the application. We believe improving design and UX of the application is an ongoing journey. User feedback and bugs raised also provide insights into how both can be improved. if you would like to provide design related suggestions or contribute with design inputs, raise issues on the [Design repo of RTL](https://github.com/Ride-The-Lightning/RTL-Design) and follow the guidance provided there.

#### <a name="code"></a>Code
Contributions via code is the most sought after contribution and something we enthusiastically encourage. Follow the below guideline to be able to contribute code to RTL.
##### Pull Code
##### Install Dependencies
##### Node Server
##### Angular Server for Development
##### Package Angular Updates
##### Create a New Branch
##### Caution about adding new libraries
* We are very conservative in adding new dependencies. Do your best to not add any new libraries on RTL. This is the best strategy to keep the software safe from adding new vulnerabilites.
* Confirm before starting by creating an issue about the adding the library 
* The library should be popular, well maintained and pre-existing vulnerability free.

##### Commit Updates
##### Create Pull Request