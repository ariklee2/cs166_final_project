EXPLAIN ANALYZE
SELECT
    i.item_id AS id,
    i.item_name,
    i.category,
    i.item_condition,
    i.description,
    i.image_url,
    i.seller_login,
    COALESCE(a.current_highest_bid, i.starting_price) AS current_bid,
    a.auction_status,
    a.winner_login,
    s.tracking_number,
    s.shipment_status,
    s.address AS shipping_address
FROM item i
LEFT JOIN auction a ON i.item_id = a.item_id
LEFT JOIN shipment s ON a.auction_id = s.auction_id;

EXPLAIN ANALYZE
SELECT
    i.item_id,
    i.item_name,
    i.category,
    i.image_url,
    a.auction_id,
    a.current_highest_bid,
    a.auction_status
FROM auction a
JOIN item i ON a.item_id = i.item_id
WHERE a.auction_status = 'Active'
  AND i.category = 'Electronics'
ORDER BY a.current_highest_bid DESC;

EXPLAIN ANALYZE
SELECT auction_id, current_highest_bid
FROM auction
WHERE item_id = 1001;

EXPLAIN ANALYZE
SELECT b.buyer_login
FROM bid b
JOIN auction a ON b.auction_id = a.auction_id
WHERE a.item_id = 1001
ORDER BY b.bid_amount DESC, b.bid_timestamp ASC
LIMIT 1;

EXPLAIN ANALYZE
SELECT
    a.auction_id,
    a.item_id,
    a.current_highest_bid,
    a.auction_status,
    i.item_name,
    i.category
FROM auction a
JOIN item i ON a.item_id = i.item_id
WHERE a.seller_login = 'seller1'
  AND a.auction_status = 'Active'
ORDER BY a.auction_id DESC;

EXPLAIN ANALYZE
SELECT auction_id, item_id, current_highest_bid, winner_login, auction_status
FROM auction
WHERE winner_login = 'buyer1'
  AND auction_status = 'Closed';

EXPLAIN ANALYZE
SELECT payment_id, auction_id, buyer_login, amount, payment_status
FROM payment
WHERE payment_status = 'Pending'
ORDER BY payment_id DESC;

EXPLAIN ANALYZE
SELECT shipment_id, auction_id, shipment_status, tracking_number, address
FROM shipment
WHERE shipment_status = 'Pending'
ORDER BY shipment_id DESC;