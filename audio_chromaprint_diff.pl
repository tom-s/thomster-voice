#!/usr/bin/env perl
#Script to calculate the similarity of the two audio files using chromaprint fingerprint algorithem
#License: LGPL2.1+
#Author: Bakkiaraj M [http://npointsolutions.blogspot.in/]
#Usage: audio_chromaprint_diff.pl audio1_file audio2_file
#Note: Install the fpcalc tool version 1.1 before you run this script

#Refer URLs
#Refer: http://acoustid.org/chromaprint
#Refer: http://en.wikipedia.org/wiki/Coefficient_of_determination

use strict;
use warnings;
use Statistics::LineFit;
use Data::Dumper;
use Capture::Tiny ':all';

#Globals
my $fp1ArrRef;
my $fp2ArrRef;
my $audioLen = 9999; #Len in secs for fingerprint calculation. Just give rough high number. Later enhance based on songs.

my $fpcalctool = '/usr/bin/fpcalc -raw -length '.$audioLen.' ';

#Get the file names from the command line
my $fn1 = $ARGV[0];
my $fn2 = $ARGV[1];

my $fn1FPs = 0;
my $fn2FPs = 0;
my $fpDiff = 0;

if (!defined ($fn1) or !defined ($fn2))
{
 print "\n Usage: perl $0 audio_file1 audio_file2";
 exit (-1);
}

if (! -s $fn1 or ! -s $fn2)
{
 print "\n ERROR: $fn1 or $fn2 is not a proper file.";
 exit (-1);
}


#Function
sub calcFingerPrint
{
 my $fileName = shift @_;

 #print "\n EXEC: $fpcalctool \"$fileName\"";

 my ($fpdata, $stderr, $exit) = capture {

        system( $fpcalctool.' "'.$fileName.'"' );
     };

    unless ($exit == 0)
    {
     print "\n ERROR: While running fpcalc tool";
     print "\n CMD: ",$fpcalctool.' "'.$fileName.'"';
     print "\n STDERR: ", $stderr;
     exit ($exit);
    }

 if ($fpdata =~m/FINGERPRINT=(.*)/g)
 {
  my @fpDataArray = ();
     @fpDataArray = split (/,/,$1);
     return \@fpDataArray;
 }
 else
 {
  return [];
 }
}

$fp1ArrRef = calcFingerPrint($fn1);
$fn1FPs = scalar @$fp1ArrRef;
$fp2ArrRef = calcFingerPrint($fn2);
$fn2FPs = scalar @$fp2ArrRef;

#$,=" ";
print "\n File1: $fn1 Tot FPs ",$fn1FPs;
#print "\n ", @$fp1ArrRef;
print "\n File2: $fn2 Tot FPs ", $fn2FPs;
#print "\n ", @$fp1ArrRef;

if ($fn1FPs != $fn2FPs)
{
 #Equalise th array items , so it will be equal.
 if ($fn1FPs > $fn2FPs)
 {
  splice ($fp1ArrRef,$fn2FPs);
 }
 else
 {
     splice ($fp2ArrRef,$fn1FPs);
 }
    print "\ Note: File1 & File2 have different FingerPrints, Lowest number of Fingerprints will be used in R2";
}



my $lfit = Statistics::LineFit->new();
$lfit->setData($fp1ArrRef, $fp2ArrRef);

printf "\n\n Goodnees of fit R2 for File1 & File2 = %.8f \n", $lfit->rSquared();

exit (0);