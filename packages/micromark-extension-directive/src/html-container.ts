import type {HtmlExtension} from 'micromark-util-types'
import {
  enter,
  enterAttributes,
  enterLabel,
  exitName,
  exitLabel,
  exitAttributeIdValue,
  exitAttributeClassValue,
  exitAttributeName,
  exitAttributeValue,
  exitAttributes,
  exitContainerContent,
  exitContainerFence,
  createExit
} from './html-shared.js'
import type {HtmlOptions} from './index.js'
import {EMPTY_OBJECT} from '@sequelize/utils'

/**
 * Create an extension for `micromark` to support container directives when
 * serializing to HTML.
 *
 * @param options
 *   Configuration (default: `{}`).
 * @returns
 *   Extension for `micromark` that can be passed in `htmlExtensions`, to
 *   support container directives when serializing to HTML.
 */
export function directiveContainerHtml(
  options: HtmlOptions = EMPTY_OBJECT
): HtmlExtension {
  return {
    enter: {
      directiveContainer() {
        enter.call(this, 'containerDirective')
      },
      directiveContainerAttributes: enterAttributes,
      directiveContainerLabel: enterLabel,
      directiveContainerContent() {
        this.buffer()
      }
    },
    exit: {
      directiveContainer: createExit(options),
      directiveContainerAttributeClassValue: exitAttributeClassValue,
      directiveContainerAttributeIdValue: exitAttributeIdValue,
      directiveContainerAttributeName: exitAttributeName,
      directiveContainerAttributeValue: exitAttributeValue,
      directiveContainerAttributes: exitAttributes,
      directiveContainerContent: exitContainerContent,
      directiveContainerFence: exitContainerFence,
      directiveContainerLabel: exitLabel,
      directiveContainerName: exitName
    }
  }
}
