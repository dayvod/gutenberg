/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock, parse } from '@wordpress/blocks';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	forwardRef,
	useCallback,
	useState,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import createDataTree from './create-data-tree';

/**
 * A recursive function that maps menu item nodes to blocks.
 *
 * @param {Object[]} menuItems An array of menu items.
 * @return {WPBlock[]} An array of blocks.
 */
function mapMenuItemsToBlocks( menuItems ) {
	return menuItems.map( ( menuItem ) => {
		if ( menuItem.type === 'block' ) {
			const [ block ] = parse( menuItem.content.raw );

			if ( ! block ) {
				return createBlock( 'core/freeform', {
					content: menuItem.content,
				} );
			}

			return block;
		}

		const attributes = {
			label: ! menuItem.title.rendered
				? __( '(no title)' )
				: menuItem.title.rendered,
			opensInNewTab: menuItem.target === '_blank',
		};

		if ( menuItem.url ) {
			attributes.url = menuItem.url;
		}

		if ( menuItem.description ) {
			attributes.description = menuItem.description;
		}

		if ( menuItem.xfn?.length && some( menuItem.xfn ) ) {
			attributes.rel = menuItem.xfn.join( ' ' );
		}

		if ( menuItem.classes?.length && some( menuItem.classes ) ) {
			attributes.className = menuItem.classes.join( ' ' );
		}

		const innerBlocks = menuItem.children?.length
			? mapMenuItemsToBlocks( menuItem.children )
			: [];

		return createBlock( 'core/navigation-link', attributes, innerBlocks );
	} );
}

/**
 * Convert a flat menu item structure to a nested blocks structure.
 *
 * @param {Object[]} menuItems An array of menu items.
 *
 * @return {WPBlock[]} An array of blocks.
 */
function convertMenuItemsToBlocks( menuItems ) {
	if ( ! menuItems ) {
		return null;
	}

	const menuTree = createDataTree( menuItems );
	return mapMenuItemsToBlocks( menuTree );
}

/**
 * Convert pages to blocks.
 *
 * @param {Object[]} pages An array of pages.
 *
 * @return {WPBlock[]} An array of blocks.
 */
function convertPagesToBlocks( pages ) {
	if ( ! pages ) {
		return null;
	}

	return pages.map( ( { title, type, link: url, id } ) =>
		createBlock( 'core/navigation-link', {
			type,
			id,
			url,
			label: ! title.rendered ? __( '(no title)' ) : title.rendered,
			opensInNewTab: false,
		} )
	);
}

function NavigationPlaceholder( { onCreate }, ref ) {
	const [ selectedMenu, setSelectedMenu ] = useState();

	const [ isCreatingFromMenu, setIsCreatingFromMenu ] = useState( false );

	const {
		pages,
		isResolvingPages,
		hasResolvedPages,
		menus,
		isResolvingMenus,
		hasResolvedMenus,
		menuItems,
		hasResolvedMenuItems,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				getMenus,
				getMenuItems,
				isResolving,
				hasFinishedResolution,
			} = select( 'core' );
			const pagesParameters = [
				'postType',
				'page',
				{
					parent: 0,
					order: 'asc',
					orderby: 'id',
					per_page: -1,
				},
			];
			const menusParameters = [ { per_page: -1 } ];
			const hasSelectedMenu = selectedMenu !== undefined;
			const menuItemsParameters = hasSelectedMenu
				? [
						{
							menus: selectedMenu,
							per_page: -1,
						},
				  ]
				: undefined;

			return {
				pages: getEntityRecords( ...pagesParameters ),
				isResolvingPages: isResolving(
					'getEntityRecords',
					pagesParameters
				),
				hasResolvedPages: hasFinishedResolution(
					'getEntityRecords',
					pagesParameters
				),
				menus: getMenus( ...menusParameters ),
				isResolvingMenus: isResolving( 'getMenus', menusParameters ),
				hasResolvedMenus: hasFinishedResolution(
					'getMenus',
					menusParameters
				),
				menuItems: hasSelectedMenu
					? getMenuItems( ...menuItemsParameters )
					: undefined,
				hasResolvedMenuItems: hasSelectedMenu
					? hasFinishedResolution(
							'getMenuItems',
							menuItemsParameters
					  )
					: false,
			};
		},
		[ selectedMenu ]
	);

	const hasPages = !! ( hasResolvedPages && pages?.length );
	const hasMenus = !! ( hasResolvedMenus && menus?.length );
	const isLoading = isResolvingPages || isResolvingMenus;

	const createFromMenu = useCallback( () => {
		const blocks = convertMenuItemsToBlocks( menuItems );
		const selectNavigationBlock = true;
		onCreate( blocks, selectNavigationBlock );
	} );

	const onCreateFromMenu = () => {
		// If we have menu items, create the block right away.
		if ( hasResolvedMenuItems ) {
			createFromMenu();
			return;
		}

		// Otherwise, create the block when resolution finishes.
		setIsCreatingFromMenu( true );
	};

	const onCreateEmptyMenu = () => {
		onCreate( [] );
	};

	const onCreateAllPages = () => {
		const blocks = convertPagesToBlocks( pages );
		const selectNavigationBlock = true;
		onCreate( blocks, selectNavigationBlock );
	};

	useEffect( () => {
		// If the user selected a menu but we had to wait for menu items to
		// finish resolving, then create the block once resolution finishes.
		if ( isCreatingFromMenu && hasResolvedMenuItems ) {
			createFromMenu();
			setIsCreatingFromMenu( false );
		}
	}, [ isCreatingFromMenu, hasResolvedMenuItems ] );

	return (
		<div className="wp-block-navigation-placeholder">
			{ isLoading && (
				<div ref={ ref }>
					<Spinner /> { __( 'Loading…' ) }
				</div>
			) }
			{ ! isLoading && (
				<div
					ref={ ref }
					className="wp-block-navigation-placeholder__actions"
				>
					{ hasPages ? (
						<Button onClick={ onCreateAllPages }>
							Add all pages
						</Button>
					) : undefined }
					{ hasMenus ? (
						<DropdownMenu
							icon={ null }
							text={ __( 'Existing Menu' ) }
						>
							{ ( { onClose } ) => (
								<MenuGroup>
									{ menus.map( ( menu ) => {
										return (
											<MenuItem
												onClick={ () => {
													setSelectedMenu( menu.id );
													onCreateFromMenu();
												} }
												onClose={ onClose }
												key={ menu.id }
											>
												{ menu.name }
											</MenuItem>
										);
									} ) }
								</MenuGroup>
							) }
						</DropdownMenu>
					) : undefined }
					<Button onClick={ onCreateEmptyMenu }>Start Empty</Button>
				</div>
			) }
		</div>
	);
}

export default forwardRef( NavigationPlaceholder );
