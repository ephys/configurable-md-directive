import type {CompileContext} from 'micromark-util-types'

export {directiveContainer} from './syntax-container.js'
export {directiveLeaf} from './syntax-leaf.js'
export {directiveText} from './syntax-text.js'
export {directiveContainerHtml} from './html-container.js'
export {directiveLeafHtml} from './html-leaf.js'
export {directiveTextHtml} from './html-text.js'

/**
 * Directive attribute.
 */
type Attributes = Record<string, string>

/**
 * Structure representing a directive.
 */
export type Directive = {
  /**
   * Private :)
   */
  _fenceCount?: number | undefined
  /**
   * Object w/ HTML attributes.
   */
  attributes?: Attributes | undefined
  /**
   * Compiled HTML content inside container directive.
   */
  content?: string | undefined
  /**
   * Compiled HTML content that was in `[brackets]`.
   */
  label?: string | undefined
  /**
   * Name of directive.
   */
  name: string
  /**
   * Kind.
   */
  type: 'containerDirective' | 'leafDirective' | 'textDirective'
}

/**
 * Handle a directive.
 *
 * @param this
 *   Current context.
 * @param directive
 *   Directive.
 * @returns
 *   Signal whether the directive was handled.
 *
 *   Yield `false` to let the fallback (a special handle for `'*'`) handle it.
 */
export type Handle = (
  this: CompileContext,
  directive: Directive
) => boolean | undefined

/**
 * Configuration.
 *
 * > 👉 **Note**: the special field `'*'` can be used to specify a fallback
 * > handle to handle all otherwise unhandled directives.
 */
export type HtmlOptions = Record<string, Handle>

/**
 * Internal tuple representing an attribute.
 */
type AttributeTuple = [key: string, value: string]

declare module 'micromark-util-types' {
  /**
   * Compile data.
   */
  interface CompileData {
    directiveAttributes?: AttributeTuple[]
    directiveStack?: Directive[]
  }

  /**
   * Token types.
   */
  interface TokenTypeMap {
    directiveContainer: 'directiveContainer'
    directiveContainerAttribute: 'directiveContainerAttribute'
    directiveContainerAttributeClass: 'directiveContainerAttributeClass'
    directiveContainerAttributeClassValue: 'directiveContainerAttributeClassValue'
    directiveContainerAttributeId: 'directiveContainerAttributeId'
    directiveContainerAttributeIdValue: 'directiveContainerAttributeIdValue'
    directiveContainerAttributeInitializerMarker: 'directiveContainerAttributeInitializerMarker'
    directiveContainerAttributeName: 'directiveContainerAttributeName'
    directiveContainerAttributes: 'directiveContainerAttributes'
    directiveContainerAttributesMarker: 'directiveContainerAttributesMarker'
    directiveContainerAttributeValue: 'directiveContainerAttributeValue'
    directiveContainerAttributeValueData: 'directiveContainerAttributeValueData'
    directiveContainerAttributeValueLiteral: 'directiveContainerAttributeValueLiteral'
    directiveContainerAttributeValueMarker: 'directiveContainerAttributeValueMarker'
    directiveContainerContent: 'directiveContainerContent'
    directiveContainerFence: 'directiveContainerFence'
    directiveContainerLabel: 'directiveContainerLabel'
    directiveContainerLabelMarker: 'directiveContainerLabelMarker'
    directiveContainerLabelString: 'directiveContainerLabelString'
    directiveContainerName: 'directiveContainerName'
    directiveContainerSequence: 'directiveContainerSequence'

    directiveLeaf: 'directiveLeaf'
    directiveLeafAttribute: 'directiveLeafAttribute'
    directiveLeafAttributeClass: 'directiveLeafAttributeClass'
    directiveLeafAttributeClassValue: 'directiveLeafAttributeClassValue'
    directiveLeafAttributeId: 'directiveLeafAttributeId'
    directiveLeafAttributeIdValue: 'directiveLeafAttributeIdValue'
    directiveLeafAttributeInitializerMarker: 'directiveLeafAttributeInitializerMarker'
    directiveLeafAttributeName: 'directiveLeafAttributeName'
    directiveLeafAttributes: 'directiveLeafAttributes'
    directiveLeafAttributesMarker: 'directiveLeafAttributesMarker'
    directiveLeafAttributeValue: 'directiveLeafAttributeValue'
    directiveLeafAttributeValueData: 'directiveLeafAttributeValueData'
    directiveLeafAttributeValueLiteral: 'directiveLeafAttributeValueLiteral'
    directiveLeafAttributeValueMarker: 'directiveLeafAttributeValueMarker'
    directiveLeafLabel: 'directiveLeafLabel'
    directiveLeafLabelMarker: 'directiveLeafLabelMarker'
    directiveLeafLabelString: 'directiveLeafLabelString'
    directiveLeafName: 'directiveLeafName'
    directiveLeafSequence: 'directiveLeafSequence'

    directiveText: 'directiveText'
    directiveTextAttribute: 'directiveTextAttribute'
    directiveTextAttributeClass: 'directiveTextAttributeClass'
    directiveTextAttributeClassValue: 'directiveTextAttributeClassValue'
    directiveTextAttributeId: 'directiveTextAttributeId'
    directiveTextAttributeIdValue: 'directiveTextAttributeIdValue'
    directiveTextAttributeInitializerMarker: 'directiveTextAttributeInitializerMarker'
    directiveTextAttributeName: 'directiveTextAttributeName'
    directiveTextAttributes: 'directiveTextAttributes'
    directiveTextAttributesMarker: 'directiveTextAttributesMarker'
    directiveTextAttributeValue: 'directiveTextAttributeValue'
    directiveTextAttributeValueData: 'directiveTextAttributeValueData'
    directiveTextAttributeValueLiteral: 'directiveTextAttributeValueLiteral'
    directiveTextAttributeValueMarker: 'directiveTextAttributeValueMarker'
    directiveTextLabel: 'directiveTextLabel'
    directiveTextLabelMarker: 'directiveTextLabelMarker'
    directiveTextLabelString: 'directiveTextLabelString'
    directiveTextMarker: 'directiveTextMarker'
    directiveTextName: 'directiveTextName'
  }
}
