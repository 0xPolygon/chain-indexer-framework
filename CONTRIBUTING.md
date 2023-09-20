We are really glad you're reading this, because we need volunteer developers to help this project come to fruition!✨Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

In this guide you will get an overview of the contribution workflow from opening an issue, creating a PR, and merging the PR.

## Feature requests

If you find yourself wishing for a feature that doesn't exist in Chain Indexer Framework, you are probably not alone. There are bound to be others out there with similar needs. Many of the features that Chain Indexer Framework has today have been added because our users saw the need. Open an issue on our issues list on GitHub which describes the feature you would like to see, why you need it, and how it should work.

### How to Get in Touch

Our active Discord community is always ready to help and support new and experienced contributors alike. Link

## Contributing code and documentation changes

If you would like to contribute a new feature or a bug fix to **Chain Indexer Framework**, please discuss your idea first on the GitHub issue. If there is no GitHub issue for your idea, please open one. It may be that somebody is already working on it, or that there are particular complexities that you should know about before starting the implementation. There are often a number of ways to fix a problem and it is important to find the right approach before spending time on a PR that cannot be merged.

We add the `help wanted` label to existing GitHub issues for which community contributions are particularly welcome, and we use the `good first issue` label to mark issues that we think will be suitable for new contributors.

### Fork and clone the repository

You will need to fork the main **Chain Indexer Framework** code or documentation repository and clone it to your local machine. See [github help page](https://help.github.com/articles/fork-a-repo) for help.

Further instructions for specific projects are given below.

### Tips for code changes

Following these tips prior to raising a pull request will speed up the review cycle.

- Add appropriate unit tests
- Add integration tests, if applicable
- Lines that are not part of your change should not be edited (e.g. don't format unchanged lines, don't reorder existing imports)
- Add the appropriate license headers to any new files

### Submitting your changes

Once your changes and tests are ready to submit for review:

1. Test your changes

   Run the test suite to make sure that nothing is broken. See the TESTING file for help running tests.

2. Rebase your changes

   Update your local repository with the most recent code from the main **Chain Indexer Framework** repository, and rebase your branch on top of the latest main branch. We prefer your initial changes to be squashed into a single commit. Later, if we ask you to make changes, add them as separate commits. This makes them easier to review. As a final step before merging we will either ask you to squash all commits yourself or we'll do it for you.

3. Submit a pull request

   Push your local changes to your forked copy of the repository and [submit a pull request](https://help.github.com/articles/using-pull-requests). In the pull request, choose a title which sums up the changes that you have made, and in the body provide more details about what your changes do. Also mention the number of the issue where discussion has taken place, eg "Closes #123".

Then sit back and wait. There will probably be discussion about the pull request and, if any changes are needed, we would love to work with you to get your pull request merged into **Chain Indexer Framework**.

Please adhere to the general guideline that you should never force push to a publicly shared branch. Once you have opened your pull request, you should consider your branch publicly shared. Instead of force pushing you can just add incremental commits; this is generally easier on your reviewers. If you need to pick up changes from main, you can merge main into your branch. A reviewer might ask you to rebase a long-running pull request in which case force pushing is okay for that request. Note that squashing at the end of the review process should also not be done, that can be done when the pull request is [integrated via GitHub](https://github.com/blog/2141-squash-your-commits).

### Pull Requests for substantive changes (e.g. everything except comments and docs)

1. Any PR that introduces a logic change should include tests. (In many cases, the tests will take more time to write than the actual code).
2. All PRs should sit for 72 hours with the `pleasereview` tag in order to garner feedback.
3. No PR should be merged until it has been reviewed, passes CI, and all reviews' comments are
   addressed.
4. PRs should:
   1. have a narrow, well-defined focus.
   2. make the smallest set of changes possible to achieve their goal.
   3. include a clear description in the opening comment.
   4. preserve the conventions and stylistic consistency of any files they modify.
5. Given the choice between a conservative change that mostly works and an adventurous change which seems better but introduces uncertainty - prefer the conservative change.

### Reviews

The end goal of review is to suggest useful improvements to the author. Reviews should finish with approval unless there are issues that would result in:

1. Buggy behaviour.
2. Undue maintenance burden.
3. Pessimisation (i.e. speed reduction / meaningful build-size increases).
4. Feature reduction (i.e. it removes some aspect of functionality that users rely on).
5. Avoidable risk (i.e it's difficult to test or hard to anticipate the implications of, without
   being strictly necessary to fix something broken).

Read more in [Review Guidelines](./REVIEW.md).

### License

By contributing to **Chain Indexer Framework**, you agree that your contributions will be licensed under its [license](./LICENSE).
