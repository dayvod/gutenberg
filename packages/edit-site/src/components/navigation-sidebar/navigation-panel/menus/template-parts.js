/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItem from '../template-navigation-item';
import { MENU_ROOT, MENU_TEMPLATE_PARTS } from '../constants';
import { SearchResults } from '../search-results';
import { useDebouncedSearch } from '../use-debounced-search';

export default function TemplatePartsMenu() {
	const { search, menuProps: searchMenuProps } = useDebouncedSearch();

	const templateParts = useSelect(
		( select ) => {
			const unfilteredTemplateParts =
				select( 'core' ).getEntityRecords(
					'postType',
					'wp_template_part',
					{
						status: [ 'publish', 'auto-draft' ],
						per_page: -1,
						search,
					}
				) || [];
			const currentTheme = select( 'core' ).getCurrentTheme()?.stylesheet;
			return unfilteredTemplateParts.filter(
				( item ) =>
					item.status === 'publish' ||
					item.wp_theme_slug === currentTheme
			);
		},
		[ search ]
	);

	return (
		<NavigationMenu
			menu={ MENU_TEMPLATE_PARTS }
			title={ __( 'Template Parts' ) }
			parentMenu={ MENU_ROOT }
			{ ...searchMenuProps }
		>
			{ search && (
				<SearchResults items={ templateParts }>
					{ map( templateParts, ( templatePart ) => (
						<TemplateNavigationItem
							item={ templatePart }
							key={ `wp_template_part-${ templatePart.id }` }
						/>
					) ) }
				</SearchResults>
			) }

			{ ! search &&
				map( templateParts, ( templatePart ) => (
					<TemplateNavigationItem
						item={ templatePart }
						key={ `wp_template_part-${ templatePart.id }` }
					/>
				) ) }

			{ ! search && templateParts === null && (
				<NavigationItem title={ __( 'Loading…' ) } />
			) }
		</NavigationMenu>
	);
}
