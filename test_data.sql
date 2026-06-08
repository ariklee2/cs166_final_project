TRUNCATE shipment, payment, bid, auction, item, users CASCADE;

INSERT INTO users (login, password, phone_num, address, role, favorite_category)
SELECT
    'buyer' || g,
    'pass',
    '555-000-' || LPAD(g::text, 4, '0'),
    g || ' Buyer Street, Riverside CA',
    'Buyer',
    CASE (g % 5)
        WHEN 0 THEN 'Electronics'
        WHEN 1 THEN 'Books'
        WHEN 2 THEN 'Sports'
        WHEN 3 THEN 'Clothing'
        ELSE 'Home'
    END
FROM generate_series(1, 500) AS g;

INSERT INTO users (login, password, phone_num, address, role, favorite_category)
SELECT
    'seller' || g,
    'pass',
    '555-100-' || LPAD(g::text, 4, '0'),
    g || ' Seller Avenue, Riverside CA',
    'Seller',
    CASE (g % 5)
        WHEN 0 THEN 'Electronics'
        WHEN 1 THEN 'Books'
        WHEN 2 THEN 'Sports'
        WHEN 3 THEN 'Clothing'
        ELSE 'Home'
    END
FROM generate_series(1, 100) AS g;

INSERT INTO users (login, password, phone_num, address, role, favorite_category)
VALUES ('admin1', 'pass', '555-999-0000', 'Admin Office, Riverside CA', 'Admin', NULL);

INSERT INTO item
(item_id, item_name, category, starting_price, image_url, item_condition, description, seller_login, seller_role)
SELECT
    g,
    'Item ' || g,
    CASE (g % 5)
        WHEN 0 THEN 'Electronics'
        WHEN 1 THEN 'Books'
        WHEN 2 THEN 'Sports'
        WHEN 3 THEN 'Clothing'
        ELSE 'Home'
    END,
    (10 + (g % 300))::numeric(10,2),
    'https://example.com/item' || g || '.jpg',
    CASE (g % 4)
        WHEN 0 THEN 'New'
        WHEN 1 THEN 'Like New'
        WHEN 2 THEN 'Good'
        ELSE 'Used'
    END,
    'Test description for item ' || g,
    'seller' || (((g - 1) % 100) + 1),
    'Seller'
FROM generate_series(1, 1000) AS g;

INSERT INTO auction
(auction_id, item_id, seller_login, seller_role, current_highest_bid, auction_status)
SELECT
    g,
    g,
    'seller' || (((g - 1) % 100) + 1),
    'Seller',
    (10 + (g % 300))::numeric(10,2),
    CASE WHEN (g % 5) = 0 THEN 'Closed' ELSE 'Active' END
FROM generate_series(1, 1000) AS g;

INSERT INTO bid
(bid_id, auction_id, buyer_login, buyer_role, bid_amount, bid_timestamp)
SELECT
    g,
    (((g - 1) % 1000) + 1),
    'buyer' || (((g - 1) % 500) + 1),
    'Buyer',
    (20 + (g % 5000))::numeric(10,2),
    CURRENT_TIMESTAMP - (g || ' seconds')::interval
FROM generate_series(1, 20000) AS g;

UPDATE auction a
SET current_highest_bid = b.max_bid
FROM (
    SELECT auction_id, MAX(bid_amount) AS max_bid
    FROM bid
    GROUP BY auction_id
) AS b
WHERE a.auction_id = b.auction_id;

UPDATE auction a
SET winner_login = b.buyer_login,
    winner_role = 'Buyer'
FROM (
    SELECT DISTINCT ON (auction_id)
        auction_id,
        buyer_login,
        bid_amount,
        bid_timestamp
    FROM bid
    ORDER BY auction_id, bid_amount DESC, bid_timestamp ASC
) AS b
WHERE a.auction_id = b.auction_id
  AND a.auction_status = 'Closed';

INSERT INTO payment
(payment_id, auction_id, buyer_login, buyer_role, amount, payment_status)
SELECT
    auction_id,
    auction_id,
    winner_login,
    'Buyer',
    current_highest_bid,
    CASE (auction_id % 3)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Completed'
        ELSE 'Failed'
    END
FROM auction
WHERE auction_status = 'Closed'
  AND winner_login IS NOT NULL;

INSERT INTO shipment
(shipment_id, auction_id, address, shipment_status, tracking_number)
SELECT
    p.payment_id,
    p.auction_id,
    'Shipping address for auction ' || p.auction_id,
    CASE (p.auction_id % 3)
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Shipped'
        ELSE 'Delivered'
    END,
    'TRK-' || LPAD(p.auction_id::text, 8, '0')
FROM payment p
WHERE p.payment_status = 'Completed';

ANALYZE;

SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'item', COUNT(*) FROM item
UNION ALL SELECT 'auction', COUNT(*) FROM auction
UNION ALL SELECT 'bid', COUNT(*) FROM bid
UNION ALL SELECT 'payment', COUNT(*) FROM payment
UNION ALL SELECT 'shipment', COUNT(*) FROM shipment;
