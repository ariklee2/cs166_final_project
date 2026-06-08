DROP INDEX IF EXISTS index_item_category_hash;
DROP INDEX IF EXISTS index_item_name_btree;
DROP INDEX IF EXISTS index_item_seller_btree;
DROP INDEX IF EXISTS index_auction_item_btree;
DROP INDEX IF EXISTS index_auction_seller_status_btree;
DROP INDEX IF EXISTS index_auction_active_bid_btree;
DROP INDEX IF EXISTS index_bid_auction_amount_time_btree;
DROP INDEX IF EXISTS index_bid_buyer_time_btree;
DROP INDEX IF EXISTS index_payment_status_hash;
DROP INDEX IF EXISTS index_payment_buyer_btree;
DROP INDEX IF EXISTS index_shipment_status_hash;
DROP INDEX IF EXISTS index_shipment_tracking_btree;

CREATE INDEX index_item_category_hash ON item USING HASH (category);

CREATE INDEX index_item_name_btree ON item USING BTREE (item_name);

CREATE INDEX index_item_seller_btree ON item USING BTREE (seller_login, seller_role);

CREATE INDEX index_auction_item_btree ON auction USING BTREE (item_id);

CREATE INDEX index_auction_seller_status_btree ON auction USING BTREE (seller_login, seller_role, auction_status);

CREATE INDEX index_auction_active_bid_btree ON auction USING BTREE (current_highest_bid DESC, auction_id) WHERE auction_status = 'Active';

CREATE INDEX index_bid_auction_amount_time_btree ON bid USING BTREE (auction_id, bid_amount DESC, bid_timestamp ASC);

CREATE INDEX index_bid_buyer_time_btree ON bid USING BTREE (buyer_login, buyer_role, bid_timestamp DESC);

CLUSTER bid USING index_bid_auction_amount_time_btree;

CREATE INDEX index_payment_status_hash ON payment USING HASH (payment_status);

CREATE INDEX index_payment_buyer_btree ON payment USING BTREE (buyer_login, buyer_role);

CREATE INDEX index_shipment_status_hash ON shipment USING HASH (shipment_status);

CREATE INDEX index_shipment_tracking_btree ON shipment USING BTREE (tracking_number) WHERE tracking_number IS NOT NULL;


ANALYZE users;
ANALYZE item;
ANALYZE auction;
ANALYZE bid;
ANALYZE payment;
ANALYZE shipment;