--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: is_duplicate_bump(double precision, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_duplicate_bump(lat double precision, lng double precision, within_meters integer DEFAULT 50) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if there's a bump within the specified distance (approximate using coordinates)
  -- Rough calculation: 1 degree ≈ 111km, so 50m ≈ 0.00045 degrees
  RETURN EXISTS (
    SELECT 1
    FROM public.speed_bumps
    WHERE ABS(latitude - lat) < 0.00045
      AND ABS(longitude - lng) < 0.00045
      AND detected_at > NOW() - INTERVAL '24 hours'
  );
END;
$$;


SET default_table_access_method = heap;

--
-- Name: speed_bumps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.speed_bumps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    speed double precision NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.speed_bumps REPLICA IDENTITY FULL;


--
-- Name: speed_bumps speed_bumps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.speed_bumps
    ADD CONSTRAINT speed_bumps_pkey PRIMARY KEY (id);


--
-- Name: idx_speed_bumps_detected_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_speed_bumps_detected_at ON public.speed_bumps USING btree (detected_at);


--
-- Name: idx_speed_bumps_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_speed_bumps_location ON public.speed_bumps USING btree (latitude, longitude);


--
-- Name: speed_bumps Anyone can add speed bumps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can add speed bumps" ON public.speed_bumps FOR INSERT WITH CHECK (true);


--
-- Name: speed_bumps Anyone can view speed bumps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view speed bumps" ON public.speed_bumps FOR SELECT USING (true);


--
-- Name: speed_bumps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.speed_bumps ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


