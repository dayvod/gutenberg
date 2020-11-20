/**
 * Internal dependencies
 */
import { BASE_ENTITY_ROUTE } from './constants';

export default function getEntityRoute( postType, id ) {
	return (
		BASE_ENTITY_ROUTE +
		( postType && id ? `&postType=${ postType }&id=${ id }` : '' )
	);
}