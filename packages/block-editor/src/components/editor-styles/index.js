/**
 * External dependencies
 */
import { compact, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';

function EditorStyles( { styles } ) {
	const ref = useRef();

	useEffect( () => {
		const updatedStyles = transformStyles(
			styles,
			'.editor-styles-wrapper'
		);

		const { ownerDocument } = ref.current;
		const nodes = map( compact( updatedStyles ), ( updatedCSS ) => {
			const node = ownerDocument.createElement( 'style' );
			node.innerHTML = updatedCSS;
			ownerDocument.body.appendChild( node );

			return node;
		} );

		return () =>
			nodes.forEach( ( node ) => ownerDocument.body.removeChild( node ) );
	}, [ styles ] );

	return <div ref={ ref } />;
}

export default EditorStyles;
