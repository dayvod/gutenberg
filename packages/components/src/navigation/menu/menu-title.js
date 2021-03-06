/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, search as searchIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Animate from '../../animate';
import Button from '../../button';
import MenuTitleSearch from './menu-title-search';
import {
	MenuTitleActionsUI,
	MenuTitleHeadingUI,
	MenuTitleUI,
} from '../styles/navigation-styles';
import { useNavigationMenuContext } from './context';
import { SEARCH_FOCUS_DELAY } from '../constants';
import { useRTL } from '../../utils/rtl';

export default function NavigationMenuTitle( {
	hasSearch,
	onSearch,
	search,
	title,
	titleAction,
} ) {
	const [ isSearching, setIsSearching ] = useState( false );
	const { menu } = useNavigationMenuContext();
	const searchButtonRef = useRef();
	const isRTL = useRTL();

	if ( ! title ) {
		return null;
	}

	const onCloseSearch = () => {
		setIsSearching( false );

		// Wait for the slide-in animation to complete before focusing the search button.
		// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
		setTimeout( () => {
			searchButtonRef.current.focus();
		}, SEARCH_FOCUS_DELAY );
	};

	const menuTitleId = `components-navigation__menu-title-${ menu }`;
	/* translators: search button label for menu search box. %s: menu title */
	const searchButtonLabel = sprintf( __( 'Search in %s' ), title );

	return (
		<MenuTitleUI className="components-navigation__menu-title">
			{ ! isSearching && (
				<MenuTitleHeadingUI
					as="h2"
					className="components-navigation__menu-title-heading"
					variant="title.small"
					isRTL={ isRTL }
				>
					<span id={ menuTitleId }>{ title }</span>

					{ ( hasSearch || titleAction ) && (
						<MenuTitleActionsUI>
							{ titleAction }

							{ hasSearch && (
								<Button
									isSmall
									isTertiary
									label={ searchButtonLabel }
									onClick={ () => setIsSearching( true ) }
									ref={ searchButtonRef }
								>
									<Icon icon={ searchIcon } />
								</Button>
							) }
						</MenuTitleActionsUI>
					) }
				</MenuTitleHeadingUI>
			) }

			{ isSearching && (
				<Animate type="slide-in" options={ { origin: 'left' } }>
					{ ( { className: animateClassName } ) => (
						<div className={ animateClassName }>
							<MenuTitleSearch
								onCloseSearch={ onCloseSearch }
								onSearch={ onSearch }
								search={ search }
								title={ title }
							/>
						</div>
					) }
				</Animate>
			) }
		</MenuTitleUI>
	);
}
